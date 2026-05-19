<script setup lang="ts">
/**
 * People directory.
 *
 * The full feature set the registry's data-table primitive can show:
 *   - column-header sort + per-column filter chips
 *   - modal filter sheet (multi-select chips, type, status, location, hire-date range)
 *   - bulk-action bar (export selection, deactivate, message — all toast-only here)
 *   - row click -> /people/[id]
 *   - persona-aware columns: salary visible only to Admin
 *   - empty state on zero filtered rows
 *
 * Data lives in app/mocks/people.ts as 60 hand-tuned rows. Sortable
 * strings (startDate is ISO) so we don't need a custom sortingFn.
 *
 * Header KPI strip (4 tiles) summarises the same dataset so the page
 * doesn't feel like just a table dump.
 */
import { h, computed, ref } from 'vue'
import type { Column, ColumnDef } from '@tanstack/vue-table'
import { ArrowDownUp, MoreHorizontal, UserPlus, Download, MailPlus, UserMinus, Users, Activity, Briefcase, MapPin, SearchX } from 'lucide-vue-next'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import HrKpiTile from '@/components/HrKpiTile.vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { KpiGrid } from '@/components/ui/kpi-grid'
import { DataTable, DataTableColumnHeader, type FilterDefinition } from '@/components/ui/data-table'
import { toast } from 'vue-sonner'

import {
  EMPLOYEES,
  DEPARTMENTS,
  LOCATIONS,
  STATUSES,
  EMPLOYMENT_TYPES,
  STATUS_LABELS,
  STATUS_TONE,
  TYPE_LABELS,
  formatSalary,
  type Employee,
  type EmployeeStatus,
} from '~/mocks/people'

useHead({ title: 'People · uipkge HRMS' })

const { isAdmin } = usePersona()

// Summary tiles — recomputed from the same dataset the table renders.
// Keeps numbers honest (no separate mock source to drift).
const totals = computed(() => {
  const active = EMPLOYEES.filter((e) => e.status === 'active').length
  const onLeave = EMPLOYEES.filter((e) => e.status === 'on-leave').length
  const depts = new Set(EMPLOYEES.map((e) => e.department)).size
  const locs = new Set(EMPLOYEES.map((e) => e.location)).size
  return { active, onLeave, depts, locs }
})

// ── Columns ─────────────────────────────────────────────────────────────────
// Building columns via `h` (no JSX needed) keeps everything in one .vue file
// and lets the persona-aware salary column drop in/out via the computed array.
//
// `colHeader` wraps `h(DataTableColumnHeader, ...)` because Vue's `h()`
// doesn't propagate the SFC's `<TData, TValue>` generics through the
// runtime overload signature, leaving `Column<Employee>` ↛ `Column<unknown>`.
// Widening at the call boundary is the cleanest workaround that keeps the
// rest of the column definition fully typed.
function colHeader(column: Column<Employee, unknown>, label: string) {
  return h(DataTableColumnHeader as never, { column, label })
}

const columns = computed<ColumnDef<Employee>[]>(() => {
  const base: ColumnDef<Employee>[] = [
    {
      id: 'select',
      header: ({ table }) =>
        h(Checkbox, {
          modelValue: table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate'),
          'onUpdate:modelValue': (v: boolean | 'indeterminate') => table.toggleAllPageRowsSelected(!!v),
          ariaLabel: 'Select all rows',
        }),
      cell: ({ row }) =>
        h(Checkbox, {
          modelValue: row.getIsSelected(),
          'onUpdate:modelValue': (v: boolean | 'indeterminate') => row.toggleSelected(!!v),
          ariaLabel: 'Select row',
        }),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => colHeader(column, 'Name'),
      cell: ({ row }) => {
        const e = row.original
        return h('div', { class: 'flex items-center gap-3' }, [
          h(Avatar, { class: 'size-8' }, () => h(AvatarFallback, { class: 'text-xs font-semibold' }, () => e.initials)),
          h('div', { class: 'flex flex-col leading-tight min-w-0' }, [
            h('span', { class: 'font-medium truncate' }, e.name),
            h('span', { class: 'text-muted-foreground text-xs truncate' }, e.email),
          ]),
        ])
      },
    },
    {
      accessorKey: 'title',
      header: ({ column }) => colHeader(column, 'Title'),
      cell: ({ row }) => h('span', { class: 'text-sm' }, row.original.title),
    },
    {
      accessorKey: 'department',
      header: ({ column }) => colHeader(column, 'Department'),
      cell: ({ row }) => h('span', { class: 'text-sm font-medium' }, row.original.department),
    },
    {
      accessorKey: 'location',
      header: ({ column }) => colHeader(column, 'Location'),
      cell: ({ row }) =>
        h('span', { class: 'text-muted-foreground text-sm inline-flex items-center gap-1' }, [
          h(MapPin, { class: 'size-3' }),
          row.original.location,
        ]),
    },
    {
      accessorKey: 'employmentType',
      header: ({ column }) => colHeader(column, 'Type'),
      cell: ({ row }) =>
        h(Badge, { variant: 'outline', class: 'capitalize text-xs font-normal' }, () => TYPE_LABELS[row.original.employmentType]),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => colHeader(column, 'Status'),
      cell: ({ row }) => {
        const tone = STATUS_TONE[row.original.status]
        const variant = tone === 'success' ? 'success' : tone === 'warning' ? 'warning' : 'secondary'
        return h(Badge, { variant }, () => [
          h('span', {
            class: `size-1.5 rounded-full ${tone === 'success' ? 'bg-success' : tone === 'warning' ? 'bg-warning' : 'bg-muted-foreground/50'}`,
            'aria-hidden': 'true',
          }),
          STATUS_LABELS[row.original.status],
        ])
      },
    },
    {
      accessorKey: 'startDate',
      header: ({ column }) => colHeader(column, 'Start date'),
      cell: ({ row }) => h('span', { class: 'text-muted-foreground text-xs tabular-nums' }, row.original.startDate),
    },
  ]

  // `import.meta.client` guard: SSR's sentinel persona is `'admin'`, so
  // without the client check every visitor's initial HTML would include
  // salary figures regardless of stored persona. Column snaps in after
  // hydration when persona is authoritative.
  if (import.meta.client && isAdmin.value) {
    base.push({
      accessorKey: 'salary',
      header: ({ column }) => colHeader(column, 'Salary'),
      cell: ({ row }) => h('span', { class: 'tabular-nums text-sm font-medium' }, formatSalary(row.original.salary)),
    })
  }

  base.push({
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) =>
      h(
        DropdownMenu,
        {},
        {
          default: () => [
            h(DropdownMenuTrigger, { asChild: true }, () =>
              h(
                Button,
                {
                  variant: 'ghost',
                  size: 'icon',
                  class: 'size-8',
                  onClick: (e: Event) => e.stopPropagation(),
                  ariaLabel: 'Row actions',
                },
                () => h(MoreHorizontal, { class: 'size-4' }),
              ),
            ),
            h(DropdownMenuContent, { align: 'end', class: 'w-44' }, () => [
              h(DropdownMenuLabel, () => 'Actions'),
              h(DropdownMenuSeparator),
              h(DropdownMenuItem, { onClick: () => navigateTo(`/people/${row.original.id}`) }, () => 'Open profile'),
              h(DropdownMenuItem, { onClick: () => toast.info(`Message ${row.original.name} (mock)`) }, () => 'Send message'),
              ...(isAdmin.value
                ? [h(DropdownMenuItem, { onClick: () => toast.warning(`Deactivate ${row.original.name} (mock)`) }, () => 'Deactivate')]
                : []),
            ]),
          ],
        },
      ),
  })

  return base
})

// Filter definitions surface in the modal sheet + popovers.
const filters: FilterDefinition[] = [
  {
    column: 'department',
    label: 'Department',
    type: 'multiselect',
    options: DEPARTMENTS.map((d) => ({ value: d, label: d })),
  },
  {
    column: 'location',
    label: 'Location',
    type: 'multiselect',
    options: LOCATIONS.map((l) => ({ value: l, label: l })),
  },
  {
    column: 'status',
    label: 'Status',
    type: 'multiselect',
    options: STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s as EmployeeStatus] })),
  },
  {
    column: 'employmentType',
    label: 'Employment type',
    type: 'multiselect',
    options: EMPLOYMENT_TYPES.map((t) => ({ value: t, label: TYPE_LABELS[t] })),
  },
  {
    column: 'startDate',
    label: 'Start date',
    type: 'date',
  },
]

function handleRowClick(row: Employee) {
  navigateTo(`/people/${row.id}`)
}

const selectedCount = ref(0)
function onBulkExport(rows: any[]) {
  toast.success(`Exporting ${rows.length} employees (mock)`)
}
function onBulkMessage(rows: any[]) {
  toast.info(`Composing message to ${rows.length} employees (mock)`)
}
function onBulkDeactivate(rows: any[]) {
  toast.warning(`Deactivate flow for ${rows.length} employees (mock)`)
}
</script>

<template>
  <div class="space-y-3 p-3 md:p-4">
    <header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-bold tracking-tight">People</h1>
        <p class="text-muted-foreground text-xs">
          {{ EMPLOYEES.length }} employees across {{ totals.depts }} departments.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button v-if="isAdmin" variant="outline" size="sm">
          <Download class="mr-2 size-4" />Export all
        </Button>
        <Button v-if="isAdmin" size="sm" as-child>
          <NuxtLink to="/people/new">
            <UserPlus class="mr-2 size-4" />Add employee
          </NuxtLink>
        </Button>
      </div>
    </header>

    <KpiGrid>
      <HrKpiTile
        label="Active employees"
        :value="totals.active"
        hint="Currently on payroll"
        tone="success"
        :icon="Users"
      />
      <HrKpiTile
        label="On leave"
        :value="totals.onLeave"
        hint="PTO / sabbatical"
        tone="warning"
        :icon="Activity"
      />
      <HrKpiTile
        label="Departments"
        :value="totals.depts"
        hint="Functions"
        tone="info"
        :icon="Briefcase"
      />
      <HrKpiTile
        label="Locations"
        :value="totals.locs"
        hint="Including remote"
        tone="info"
        :icon="MapPin"
      />
    </KpiGrid>

    <DataTable
      :columns="columns"
      :data="EMPLOYEES"
      filter-column="name"
      filter-placeholder="Search by name…"
      :filters="filters"
      filter-mode="modal"
      sticky-header
      max-height="640px"
      density="cozy"
      :on-row-click="handleRowClick"
    >
      <template #bulk-actions="{ rows, clear }">
        <Button variant="outline" size="sm" @click="onBulkExport(rows); clear()">
          <Download class="mr-2 size-3.5" />Export
        </Button>
        <Button variant="outline" size="sm" @click="onBulkMessage(rows); clear()">
          <MailPlus class="mr-2 size-3.5" />Message
        </Button>
        <Button variant="outline" size="sm" class="text-destructive hover:text-destructive" @click="onBulkDeactivate(rows); clear()">
          <UserMinus class="mr-2 size-3.5" />Deactivate
        </Button>
      </template>

      <template #empty>
        <EmptyState
          :icon="SearchX"
          title="No employees match"
          description="Try clearing filters or widening the search query."
          class="py-10"
        />
      </template>
    </DataTable>
  </div>
</template>
