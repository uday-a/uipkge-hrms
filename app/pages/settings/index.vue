<script setup lang="ts">
/**
 * Settings.
 *
 * One page, six tabs:
 *   1. Profile           -- name, email (locked), pronouns, timezone,
 *                           language, bio. Save is toast-only.
 *   2. Appearance        -- theme + density radio groups, plus a
 *                           keyboard-shortcuts checkbox. No live theme
 *                           swap from here -- the topbar owns that.
 *   3. Notifications     -- grouped checkboxes covering HR events,
 *                           team signals, announcements, and digests.
 *   4. Security          -- password change form, 2FA status, active
 *                           sessions. All mutations are toast-only.
 *   5. Integrations      -- 5 service rows with Connect / Disconnect.
 *   6. Organization      -- admin-only. Company info, working hours,
 *                           compensation bands, API keys.
 *
 * Mock store is read-only; every save / connect / revoke surfaces a
 * toast so the demo reads as a real settings page without actually
 * mutating state. Defaults are pre-populated for Marcus Rivera
 * (E-0002) so refreshing in any persona shows a real-looking form.
 */
import { ref, computed } from 'vue'
import {
  User, Palette, Bell, Shield, Plug, Building2, Save, KeyRound,
  ShieldCheck, LogOut, Slack, Calendar, Github, Video, BookOpen,
  Link as LinkIcon, Plus, Trash2, Laptop, Smartphone, Monitor,
} from 'lucide-vue-next'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'vue-sonner'

import { findEmployee } from '~/mocks/people'

useHead({ title: 'Settings · uipkge HRMS' })

const { isAdmin } = usePersona()

// "Me" throughout the demo is Marcus Rivera. Resolve once so any
// future change to the persona-as-employee mapping only touches the
// ME_ID literal.
const ME_ID = 'E-0002'
const me = computed(() => findEmployee(ME_ID))

// ── Profile ────────────────────────────────────────────────────────
const profile = ref({
  name: me.value?.name ?? 'Marcus Rivera',
  email: me.value?.email ?? 'marcus.rivera@uipkge-hrms.dev',
  pronouns: 'he/him',
  timezone: 'America/New_York',
  language: 'en',
  bio: 'Staff frontend engineer leading the design-system rewrite.',
})

const TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
  { value: 'America/New_York', label: 'America/New_York (ET)' },
  { value: 'Europe/London', label: 'Europe/London (GMT)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (CET)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST)' },
  { value: 'UTC', label: 'UTC' },
]

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'de', label: 'German' },
  { value: 'fr', label: 'French' },
]

function saveProfile() {
  toast.success('Profile saved (mock)')
}

// ── Appearance ─────────────────────────────────────────────────────
// Theme radio is wired to the real `useTheme()` cookie-backed composable
// so picking light/dark/system actually flips the UI. Density + kbd
// shortcuts stay mock-only (no consumer yet). Initial value seeds from
// the cookie so a refresh shows the user's last choice.
const { theme, setTheme } = useTheme()
const appearance = ref({
  theme: theme.value,
  density: 'comfortable' as 'comfortable' | 'cozy' | 'compact',
  keyboardShortcuts: true,
})

watch(
  () => appearance.value.theme,
  (next) => {
    if (next !== theme.value) setTheme(next)
  },
)

function saveAppearance() {
  toast.success('Appearance saved (mock)')
}

// ── Notifications ──────────────────────────────────────────────────
// Grouped so the page reads as four self-contained sections rather
// than a wall of 11 checkboxes.
const notifications = ref({
  // HR events
  reviewDue: true,
  timeOffApproved: true,
  timeOffRejected: true,
  peerFeedback: false,
  // Team
  mentions: true,
  birthdays: false,
  anniversaries: false,
  // Announcements
  companyWide: true,
  policyUpdates: true,
  // Digest
  dailySummary: false,
  weeklySummary: true,
})

function saveNotifications() {
  toast.success('Notification preferences saved (mock)')
}

// ── Security ───────────────────────────────────────────────────────
const password = ref({ current: '', next: '', confirm: '' })

function changePassword() {
  if (!password.value.current || !password.value.next) {
    toast.warning('Fill in current + new password')
    return
  }
  if (password.value.next !== password.value.confirm) {
    toast.warning('New passwords do not match')
    return
  }
  toast.success('Password updated (mock)')
  password.value = { current: '', next: '', confirm: '' }
}

function enable2FA() {
  toast.info('Open 2FA setup flow (mock)')
}

const sessions = [
  { id: 's1', device: 'MacBook Pro · Chrome 132', location: 'New York, NY', lastActive: 'Active now', icon: Laptop, current: true },
  { id: 's2', device: 'iPhone 15 · Safari', location: 'New York, NY', lastActive: '2 hours ago', icon: Smartphone, current: false },
  { id: 's3', device: 'Linux Workstation · Firefox', location: 'Brooklyn, NY', lastActive: 'Yesterday, 18:42', icon: Monitor, current: false },
]

function signOutSession(device: string) {
  toast.warning(`Signed out of ${device} (mock)`)
}

// ── Integrations ───────────────────────────────────────────────────
const integrations = ref([
  { id: 'slack', name: 'Slack', description: 'Push HR notifications + reminders to channels.', icon: Slack, connected: true },
  { id: 'gcal', name: 'Google Calendar', description: 'Sync time-off and review meetings.', icon: Calendar, connected: true },
  { id: 'github', name: 'GitHub', description: 'Pull contribution signals into reviews.', icon: Github, connected: false },
  { id: 'zoom', name: 'Zoom', description: 'Auto-create meeting links for 1:1s.', icon: Video, connected: true },
  { id: 'notion', name: 'Notion', description: 'Mirror handbook + onboarding docs.', icon: BookOpen, connected: false },
])

function toggleIntegration(id: string) {
  const row = integrations.value.find((i) => i.id === id)
  if (!row) return
  row.connected = !row.connected
  if (row.connected) toast.success(`Connected ${row.name} (mock)`)
  else toast.warning(`Disconnected ${row.name} (mock)`)
}

// ── Organization (admin) ───────────────────────────────────────────
const org = ref({
  name: 'uipkge HRMS',
  domain: 'uipkge-hrms.dev',
  primaryLocation: 'New York, NY',
  workStart: '09:00',
  workEnd: '18:00',
  workDays: 'Mon–Fri',
})

const compBands = ref([
  { id: 'ic', label: 'IC (IC3–IC5)', min: 110000, max: 220000 },
  { id: 'mgr', label: 'Manager', min: 180000, max: 280000 },
  { id: 'dir', label: 'Director', min: 240000, max: 360000 },
])

function saveOrg() {
  toast.success('Organization settings saved (mock)')
}

function saveBands() {
  toast.success('Compensation bands updated (mock)')
}

const apiKeys = ref([
  { id: 'k1', name: 'Production webhook', lastUsed: '2026-05-17, 14:22' },
  { id: 'k2', name: 'Payroll sync (Gusto)', lastUsed: '2026-05-18, 06:00' },
  { id: 'k3', name: 'Dev test key', lastUsed: '2026-04-29, 11:08' },
])

function revokeKey(name: string) {
  toast.warning(`Revoked ${name} (mock)`)
}

function createApiKey() {
  toast.info('Open API key creation flow (mock)')
}
</script>

<template>
  <div class="space-y-3 p-3 md:p-4">
    <header class="space-y-1">
      <h1 class="text-xl font-bold tracking-tight">Settings</h1>
      <p class="text-muted-foreground text-xs">
        Personal preferences, notifications, security, and (admin) org-wide controls.
      </p>
    </header>

    <Tabs default-value="profile">
      <TabsList class="flex flex-wrap">
        <TabsTrigger value="profile">
          <User class="mr-1.5 size-3.5" />Profile
        </TabsTrigger>
        <TabsTrigger value="appearance">
          <Palette class="mr-1.5 size-3.5" />Appearance
        </TabsTrigger>
        <TabsTrigger value="notifications">
          <Bell class="mr-1.5 size-3.5" />Notifications
        </TabsTrigger>
        <TabsTrigger value="security">
          <Shield class="mr-1.5 size-3.5" />Security
        </TabsTrigger>
        <TabsTrigger value="integrations">
          <Plug class="mr-1.5 size-3.5" />Integrations
        </TabsTrigger>
        <ClientOnly>
          <TabsTrigger v-if="isAdmin" value="organization">
            <Building2 class="mr-1.5 size-3.5" />Organization
          </TabsTrigger>
        </ClientOnly>
      </TabsList>

      <!-- Profile -->
      <TabsContent value="profile" class="space-y-6">
        <Card>
          <CardHeader class="p-4 pb-2">
            <CardTitle class="text-sm">Personal information</CardTitle>
            <CardDescription>How you appear across the directory, reviews, and time-off requests.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4 p-4 pt-0">
            <div class="grid gap-3 md:grid-cols-2">
              <div class="space-y-2">
                <Label for="name">Full name</Label>
                <Input id="name" v-model="profile.name" />
              </div>
              <div class="space-y-2">
                <Label for="email">Work email</Label>
                <Input id="email" v-model="profile.email" disabled />
                <p class="text-muted-foreground text-xs">Managed by IT. Open a ticket to change.</p>
              </div>
              <div class="space-y-2">
                <Label for="pronouns">Pronouns</Label>
                <Input id="pronouns" v-model="profile.pronouns" placeholder="e.g. she/her" />
              </div>
              <div class="space-y-2">
                <Label>Timezone</Label>
                <Select v-model="profile.timezone">
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="tz in TIMEZONES" :key="tz.value" :value="tz.value">
                      {{ tz.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="space-y-2">
                <Label>Language</Label>
                <Select v-model="profile.language">
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="lng in LANGUAGES" :key="lng.value" :value="lng.value">
                      {{ lng.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div class="space-y-2">
              <Label for="bio">Bio</Label>
              <Textarea id="bio" v-model="profile.bio" rows="3" />
              <p class="text-muted-foreground text-xs">Shown on your profile page. Markdown not supported.</p>
            </div>
            <Separator />
            <div class="flex items-center justify-end gap-2">
              <Button variant="ghost">Discard</Button>
              <Button @click="saveProfile">
                <Save class="mr-2 size-3.5" />Save changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <!-- Appearance -->
      <TabsContent value="appearance" class="space-y-6">
        <Card>
          <CardHeader class="p-4 pb-2">
            <CardTitle class="text-sm">Theme</CardTitle>
            <CardDescription>Light, dark, or follow your operating system.</CardDescription>
          </CardHeader>
          <CardContent class="p-4 pt-0">
            <RadioGroup v-model="appearance.theme" class="grid gap-3 sm:grid-cols-3">
              <label
                v-for="opt in (['light', 'dark', 'system'] as const)"
                :key="opt"
                :class="['flex items-center gap-3 rounded-md border p-2 cursor-pointer transition-colors', appearance.theme === opt ? 'border-primary bg-primary/5' : 'hover:bg-muted/40']"
              >
                <RadioGroupItem :value="opt" />
                <div>
                  <p class="text-sm font-medium capitalize">{{ opt }}</p>
                  <p class="text-muted-foreground text-xs">
                    <template v-if="opt === 'light'">Always light, regardless of OS.</template>
                    <template v-else-if="opt === 'dark'">Always dark, regardless of OS.</template>
                    <template v-else>Match the OS preference.</template>
                  </p>
                </div>
              </label>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="p-4 pb-2">
            <CardTitle class="text-sm">Density</CardTitle>
            <CardDescription>How tightly tables and lists pack rows.</CardDescription>
          </CardHeader>
          <CardContent class="p-4 pt-0">
            <RadioGroup v-model="appearance.density" class="grid gap-3 sm:grid-cols-3">
              <label
                v-for="opt in (['comfortable', 'cozy', 'compact'] as const)"
                :key="opt"
                :class="['flex items-center gap-3 rounded-md border p-2 cursor-pointer transition-colors', appearance.density === opt ? 'border-primary bg-primary/5' : 'hover:bg-muted/40']"
              >
                <RadioGroupItem :value="opt" />
                <div>
                  <p class="text-sm font-medium capitalize">{{ opt }}</p>
                  <p class="text-muted-foreground text-xs">
                    <template v-if="opt === 'comfortable'">Roomy padding — easiest to scan.</template>
                    <template v-else-if="opt === 'cozy'">Balanced default.</template>
                    <template v-else>Maximum rows on screen.</template>
                  </p>
                </div>
              </label>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="p-4 pb-2">
            <CardTitle class="text-sm">Accessibility</CardTitle>
            <CardDescription>Keyboard navigation and motion preferences.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-3 p-4 pt-0">
            <div class="flex items-start gap-3 rounded-md border p-2">
              <Checkbox id="kbd" v-model="appearance.keyboardShortcuts" />
              <div class="min-w-0 flex-1">
                <Label for="kbd" class="text-sm font-medium">Enable keyboard shortcuts</Label>
                <p class="text-muted-foreground text-xs">Use single-key navigation like <kbd class="bg-muted rounded px-1 text-xs">g d</kbd> for dashboard.</p>
              </div>
            </div>
            <Separator />
            <div class="flex items-center justify-end gap-2">
              <Button @click="saveAppearance">
                <Save class="mr-2 size-3.5" />Save changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <!-- Notifications -->
      <TabsContent value="notifications" class="space-y-6">
        <Card>
          <CardHeader class="p-4 pb-2">
            <CardTitle class="text-sm">Email notifications</CardTitle>
            <CardDescription>Choose which events trigger an email. In-app notifications stay on for everything.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4 p-4 pt-0">
            <div class="space-y-3">
              <p class="text-muted-foreground text-xs font-semibold uppercase tracking-wide">HR events</p>
              <div class="flex items-start gap-3 rounded-md border p-2">
                <Checkbox id="n-review" v-model="notifications.reviewDue" />
                <div class="min-w-0 flex-1">
                  <Label for="n-review" class="text-sm font-medium">Review due</Label>
                  <p class="text-muted-foreground text-xs">Self-review + manager-review deadline reminders.</p>
                </div>
              </div>
              <div class="flex items-start gap-3 rounded-md border p-2">
                <Checkbox id="n-pto-approved" v-model="notifications.timeOffApproved" />
                <div class="min-w-0 flex-1">
                  <Label for="n-pto-approved" class="text-sm font-medium">Time-off approved</Label>
                  <p class="text-muted-foreground text-xs">When your request goes through.</p>
                </div>
              </div>
              <div class="flex items-start gap-3 rounded-md border p-2">
                <Checkbox id="n-pto-rejected" v-model="notifications.timeOffRejected" />
                <div class="min-w-0 flex-1">
                  <Label for="n-pto-rejected" class="text-sm font-medium">Time-off rejected</Label>
                  <p class="text-muted-foreground text-xs">When your request needs a follow-up.</p>
                </div>
              </div>
              <div class="flex items-start gap-3 rounded-md border p-2">
                <Checkbox id="n-peer" v-model="notifications.peerFeedback" />
                <div class="min-w-0 flex-1">
                  <Label for="n-peer" class="text-sm font-medium">Peer feedback requested</Label>
                  <p class="text-muted-foreground text-xs">When a teammate asks you for a peer review.</p>
                </div>
              </div>
            </div>

            <Separator />

            <div class="space-y-3">
              <p class="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Team</p>
              <div class="flex items-start gap-3 rounded-md border p-2">
                <Checkbox id="n-mentions" v-model="notifications.mentions" />
                <div class="min-w-0 flex-1">
                  <Label for="n-mentions" class="text-sm font-medium">Mentions</Label>
                  <p class="text-muted-foreground text-xs">When someone @mentions you in a comment.</p>
                </div>
              </div>
              <div class="flex items-start gap-3 rounded-md border p-2">
                <Checkbox id="n-birthdays" v-model="notifications.birthdays" />
                <div class="min-w-0 flex-1">
                  <Label for="n-birthdays" class="text-sm font-medium">Birthdays</Label>
                  <p class="text-muted-foreground text-xs">Same-day reminder for direct teammates.</p>
                </div>
              </div>
              <div class="flex items-start gap-3 rounded-md border p-2">
                <Checkbox id="n-anniv" v-model="notifications.anniversaries" />
                <div class="min-w-0 flex-1">
                  <Label for="n-anniv" class="text-sm font-medium">Work anniversaries</Label>
                  <p class="text-muted-foreground text-xs">Yearly milestones for direct teammates.</p>
                </div>
              </div>
            </div>

            <Separator />

            <div class="space-y-3">
              <p class="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Announcements</p>
              <div class="flex items-start gap-3 rounded-md border p-2">
                <Checkbox id="n-co" v-model="notifications.companyWide" />
                <div class="min-w-0 flex-1">
                  <Label for="n-co" class="text-sm font-medium">Company-wide announcements</Label>
                  <p class="text-muted-foreground text-xs">All-hands and exec posts.</p>
                </div>
              </div>
              <div class="flex items-start gap-3 rounded-md border p-2">
                <Checkbox id="n-policy" v-model="notifications.policyUpdates" />
                <div class="min-w-0 flex-1">
                  <Label for="n-policy" class="text-sm font-medium">Policy updates</Label>
                  <p class="text-muted-foreground text-xs">Handbook, benefits, and compliance changes.</p>
                </div>
              </div>
            </div>

            <Separator />

            <div class="space-y-3">
              <p class="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Digest</p>
              <div class="flex items-start gap-3 rounded-md border p-2">
                <Checkbox id="n-daily" v-model="notifications.dailySummary" />
                <div class="min-w-0 flex-1">
                  <Label for="n-daily" class="text-sm font-medium">Daily summary</Label>
                  <p class="text-muted-foreground text-xs">Single 9am email with overnight activity.</p>
                </div>
              </div>
              <div class="flex items-start gap-3 rounded-md border p-2">
                <Checkbox id="n-weekly" v-model="notifications.weeklySummary" />
                <div class="min-w-0 flex-1">
                  <Label for="n-weekly" class="text-sm font-medium">Weekly summary</Label>
                  <p class="text-muted-foreground text-xs">Friday roundup of the week's HR activity.</p>
                </div>
              </div>
            </div>

            <Separator />

            <div class="flex items-center justify-end gap-2">
              <Button @click="saveNotifications">
                <Save class="mr-2 size-3.5" />Save changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <!-- Security -->
      <TabsContent value="security" class="space-y-6">
        <Card>
          <CardHeader class="p-4 pb-2">
            <CardTitle class="text-sm">Change password</CardTitle>
            <CardDescription>Minimum 12 characters. Use a passphrase you don't reuse elsewhere.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-3 p-4 pt-0">
            <div class="grid gap-3 md:grid-cols-3">
              <div class="space-y-2">
                <Label for="pw-current">Current password</Label>
                <Input id="pw-current" v-model="password.current" type="password" placeholder="••••••••" />
              </div>
              <div class="space-y-2">
                <Label for="pw-new">New password</Label>
                <Input id="pw-new" v-model="password.next" type="password" placeholder="••••••••" />
              </div>
              <div class="space-y-2">
                <Label for="pw-confirm">Confirm new password</Label>
                <Input id="pw-confirm" v-model="password.confirm" type="password" placeholder="••••••••" />
              </div>
            </div>
            <div class="flex items-center justify-end">
              <Button @click="changePassword">
                <KeyRound class="mr-2 size-3.5" />Update password
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="p-4 pb-2">
            <div class="flex items-start justify-between gap-3">
              <div>
                <CardTitle class="text-sm">Two-factor authentication</CardTitle>
                <CardDescription>Add a second verification step at sign-in.</CardDescription>
              </div>
              <Badge variant="outline" class="bg-muted text-muted-foreground text-xs">Off</Badge>
            </div>
          </CardHeader>
          <CardContent class="p-4 pt-0">
            <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
              <div class="flex items-center gap-3">
                <div class="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-md">
                  <ShieldCheck class="size-5" />
                </div>
                <div>
                  <p class="text-sm font-medium">Authenticator app</p>
                  <p class="text-muted-foreground text-xs">Use 1Password, Authy, or any TOTP app.</p>
                </div>
              </div>
              <Button @click="enable2FA">Enable 2FA</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="p-4 pb-2">
            <CardTitle class="text-sm">Active sessions</CardTitle>
            <CardDescription>Devices currently signed into your account.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-1.5 p-4 pt-0">
            <div
              v-for="s in sessions"
              :key="s.id"
              class="flex flex-wrap items-center justify-between gap-3 rounded-md border p-2"
            >
              <div class="flex items-center gap-3">
                <div class="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-md">
                  <component :is="s.icon" class="size-4" />
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <p class="text-sm font-medium">{{ s.device }}</p>
                    <span
                      v-if="s.current"
                      class="bg-success/10 text-success border-success/20 rounded-full border px-1.5 py-0.5 text-xs font-semibold"
                    >
                      This device
                    </span>
                  </div>
                  <p class="text-muted-foreground text-xs">{{ s.location }} · {{ s.lastActive }}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                :disabled="s.current"
                @click="signOutSession(s.device)"
              >
                <LogOut class="mr-2 size-3.5" />Sign out
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <!-- Integrations -->
      <TabsContent value="integrations" class="space-y-6">
        <Card>
          <CardHeader class="p-4 pb-2">
            <CardTitle class="text-sm">Connected services</CardTitle>
            <CardDescription>Sync HRMS events with the tools your team already uses.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-1.5 p-4 pt-0">
            <div
              v-for="row in integrations"
              :key="row.id"
              class="flex flex-wrap items-center justify-between gap-3 rounded-md border p-2"
            >
              <div class="flex items-center gap-3">
                <div class="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-md">
                  <component :is="row.icon" class="size-5" />
                </div>
                <div>
                  <p class="text-sm font-medium">{{ row.name }}</p>
                  <p class="text-muted-foreground text-xs">{{ row.description }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <Badge :variant="row.connected ? 'success' : 'secondary'">
                  {{ row.connected ? 'Connected' : 'Disconnected' }}
                </Badge>
                <Button
                  :variant="row.connected ? 'outline' : 'default'"
                  size="sm"
                  @click="toggleIntegration(row.id)"
                >
                  <LinkIcon class="mr-2 size-3.5" />
                  {{ row.connected ? 'Disconnect' : 'Connect' }}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <!-- Organization (admin). ClientOnly: SSR sentinel persona is
           'admin' so without this wrap, API keys + comp bands ship in
           initial HTML for every visitor regardless of stored persona. -->
      <TabsContent v-if="isAdmin" value="organization" class="space-y-6">
        <ClientOnly>
        <Card>
          <CardHeader class="p-4 pb-2">
            <CardTitle class="text-sm">Company info</CardTitle>
            <CardDescription>Surfaced on offer letters, payslips, and the directory header.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4 p-4 pt-0">
            <div class="grid gap-3 md:grid-cols-3">
              <div class="space-y-2">
                <Label for="org-name">Company name</Label>
                <Input id="org-name" v-model="org.name" />
              </div>
              <div class="space-y-2">
                <Label for="org-domain">Primary domain</Label>
                <Input id="org-domain" v-model="org.domain" />
              </div>
              <div class="space-y-2">
                <Label for="org-loc">Primary location</Label>
                <Input id="org-loc" v-model="org.primaryLocation" />
              </div>
            </div>
            <div class="flex items-center justify-end">
              <Button @click="saveOrg">
                <Save class="mr-2 size-3.5" />Save changes
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="p-4 pb-2">
            <CardTitle class="text-sm">Working hours</CardTitle>
            <CardDescription>Default schedule used by time-off accrual and calendar holds.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4 p-4 pt-0">
            <div class="grid gap-3 md:grid-cols-3">
              <div class="space-y-2">
                <Label for="wh-days">Days</Label>
                <Input id="wh-days" v-model="org.workDays" />
              </div>
              <div class="space-y-2">
                <Label for="wh-start">Start</Label>
                <Input id="wh-start" v-model="org.workStart" type="time" />
              </div>
              <div class="space-y-2">
                <Label for="wh-end">End</Label>
                <Input id="wh-end" v-model="org.workEnd" type="time" />
              </div>
            </div>
            <p class="text-muted-foreground text-xs">
              Standard week is {{ org.workDays }} · {{ org.workStart }}–{{ org.workEnd }}. Per-employee overrides live on the profile page.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="p-4 pb-2">
            <CardTitle class="text-sm">Compensation bands</CardTitle>
            <CardDescription>USD annual base ranges by career track. Used by the offer builder.</CardDescription>
          </CardHeader>
          <CardContent class="p-4 pt-0 space-y-3">
            <div class="text-muted-foreground grid grid-cols-12 gap-3 px-3 text-xs font-semibold uppercase tracking-wide">
              <span class="col-span-4">Track</span>
              <span class="col-span-4">Min (USD)</span>
              <span class="col-span-4">Max (USD)</span>
            </div>
            <div
              v-for="band in compBands"
              :key="band.id"
              class="grid grid-cols-12 items-center gap-3 rounded-md border p-2"
            >
              <p class="col-span-4 text-sm font-medium">{{ band.label }}</p>
              <Input v-model.number="band.min" type="number" class="col-span-4" />
              <Input v-model.number="band.max" type="number" class="col-span-4" />
            </div>
            <div class="flex items-center justify-end">
              <Button @click="saveBands">
                <Save class="mr-2 size-3.5" />Save bands
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="p-4 pb-2">
            <div class="flex items-start justify-between gap-3">
              <div>
                <CardTitle class="text-sm">API keys</CardTitle>
                <CardDescription>Server-to-server credentials for integrations and webhooks.</CardDescription>
              </div>
              <Button size="sm" @click="createApiKey">
                <Plus class="mr-2 size-3.5" />New key
              </Button>
            </div>
          </CardHeader>
          <CardContent class="space-y-1.5 p-4 pt-0">
            <div
              v-for="key in apiKeys"
              :key="key.id"
              class="flex flex-wrap items-center justify-between gap-3 rounded-md border p-2"
            >
              <div class="flex items-center gap-3">
                <div class="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-md">
                  <KeyRound class="size-4" />
                </div>
                <div>
                  <p class="text-sm font-medium">{{ key.name }}</p>
                  <p class="text-muted-foreground text-xs">Last used {{ key.lastUsed }}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                class="text-destructive hover:text-destructive"
                @click="revokeKey(key.name)"
              >
                <Trash2 class="mr-2 size-3.5" />Revoke
              </Button>
            </div>
          </CardContent>
        </Card>
        </ClientOnly>
      </TabsContent>
    </Tabs>
  </div>
</template>
