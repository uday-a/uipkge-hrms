/**
 * Time-off requests across the org. Mock so SSR + client are stable.
 *
 * Two slices:
 *   - REQUESTS: full request list (60+ entries across statuses and
 *     time-frames). Drives the My-requests + Team-requests tables.
 *   - TEAM_OOO: a derived view used for the month calendar -- one
 *     entry per person-day where they're scheduled off.
 *
 * The mock "me" is E-0002 (Marcus Rivera) -- matches the topbar's
 * "Demo User" avatar and gives us a meaningful My-requests view.
 */

import { EMPLOYEES, type Employee } from './people'

export type RequestType = 'vacation' | 'sick' | 'personal' | 'parental' | 'bereavement'
export type RequestStatus = 'approved' | 'pending' | 'rejected' | 'cancelled'

export interface TimeOffRequest {
  id: string
  employeeId: string
  type: RequestType
  from: string
  to: string
  days: number
  status: RequestStatus
  submittedAt: string
  approver?: string
  reason?: string
  coverNote?: string
}

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  vacation: 'Vacation',
  sick: 'Sick',
  personal: 'Personal',
  parental: 'Parental',
  bereavement: 'Bereavement',
}

export const REQUEST_TYPE_TONE: Record<RequestType, string> = {
  vacation: 'bg-info/10 text-info border-info/20',
  sick: 'bg-destructive/10 text-destructive border-destructive/20',
  personal: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  parental: 'bg-success/10 text-success border-success/20',
  bereavement: 'bg-muted text-muted-foreground border-muted-foreground/20',
}

export const REQUEST_STATUS_TONE: Record<RequestStatus, string> = {
  approved: 'bg-success/10 text-success border-success/20',
  pending: 'bg-warning/10 text-warning border-warning/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  cancelled: 'bg-muted text-muted-foreground',
}

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  approved: 'Approved',
  pending: 'Pending',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
}

export const ME_ID = 'E-0002'

export const REQUESTS: TimeOffRequest[] = [
  // Marcus Rivera (me) ---------------------------------------------------------
  { id: 'TO-0001', employeeId: 'E-0002', type: 'vacation', from: '2026-06-15', to: '2026-06-19', days: 5, status: 'pending', submittedAt: '2026-05-12', reason: 'Family trip to Yosemite', coverNote: 'Paige Nelson covering frontend reviews.' },
  { id: 'TO-0002', employeeId: 'E-0002', type: 'vacation', from: '2026-03-09', to: '2026-03-13', days: 5, status: 'approved', submittedAt: '2026-02-15', approver: 'Sarah Connor', reason: 'NY → San Francisco travel' },
  { id: 'TO-0003', employeeId: 'E-0002', type: 'sick', from: '2026-02-04', to: '2026-02-05', days: 2, status: 'approved', submittedAt: '2026-02-04', reason: 'Flu' },
  { id: 'TO-0004', employeeId: 'E-0002', type: 'vacation', from: '2025-12-22', to: '2025-12-26', days: 3, status: 'approved', submittedAt: '2025-11-10', approver: 'Sarah Connor', reason: 'Holidays' },
  { id: 'TO-0005', employeeId: 'E-0002', type: 'personal', from: '2025-10-30', to: '2025-10-30', days: 1, status: 'cancelled', submittedAt: '2025-10-20' },

  // Team pending (managers will see these) ------------------------------------
  { id: 'TO-0006', employeeId: 'E-0021', type: 'vacation', from: '2026-05-26', to: '2026-05-30', days: 5, status: 'pending', submittedAt: '2026-05-14', reason: 'Wedding' },
  { id: 'TO-0007', employeeId: 'E-0026', type: 'vacation', from: '2026-06-02', to: '2026-06-06', days: 5, status: 'pending', submittedAt: '2026-05-15' },
  { id: 'TO-0008', employeeId: 'E-0037', type: 'sick', from: '2026-05-18', to: '2026-05-20', days: 3, status: 'pending', submittedAt: '2026-05-18', reason: 'Recovery from minor surgery' },
  { id: 'TO-0009', employeeId: 'E-0009', type: 'vacation', from: '2026-07-13', to: '2026-07-24', days: 10, status: 'pending', submittedAt: '2026-05-10', reason: 'Two-week summer trip' },
  { id: 'TO-0010', employeeId: 'E-0010', type: 'personal', from: '2026-05-22', to: '2026-05-22', days: 1, status: 'pending', submittedAt: '2026-05-16' },
  { id: 'TO-0011', employeeId: 'E-0030', type: 'vacation', from: '2026-08-04', to: '2026-08-08', days: 5, status: 'pending', submittedAt: '2026-05-14' },

  // Team approved / upcoming OOO ----------------------------------------------
  { id: 'TO-0012', employeeId: 'E-0005', type: 'vacation', from: '2026-05-12', to: '2026-05-18', days: 5, status: 'approved', submittedAt: '2026-04-15', approver: 'Laura Reed', reason: 'Honeymoon' },
  { id: 'TO-0013', employeeId: 'E-0011', type: 'vacation', from: '2026-05-19', to: '2026-05-23', days: 5, status: 'approved', submittedAt: '2026-04-22', approver: 'Hugo Park' },
  { id: 'TO-0014', employeeId: 'E-0014', type: 'parental', from: '2026-06-01', to: '2026-08-30', days: 65, status: 'approved', submittedAt: '2026-03-15', approver: 'CEO', reason: 'Parental leave' },
  { id: 'TO-0015', employeeId: 'E-0017', type: 'vacation', from: '2026-05-28', to: '2026-06-02', days: 4, status: 'approved', submittedAt: '2026-04-30', approver: 'Owen Park' },
  { id: 'TO-0016', employeeId: 'E-0023', type: 'vacation', from: '2026-07-06', to: '2026-07-10', days: 5, status: 'approved', submittedAt: '2026-05-05', approver: 'Mark Vincent' },
  { id: 'TO-0017', employeeId: 'E-0047', type: 'vacation', from: '2026-05-21', to: '2026-05-23', days: 3, status: 'approved', submittedAt: '2026-04-28', approver: 'Jessica Park' },
  { id: 'TO-0018', employeeId: 'E-0019', type: 'personal', from: '2026-05-26', to: '2026-05-26', days: 1, status: 'approved', submittedAt: '2026-05-15', approver: 'Kyle Newman' },
  { id: 'TO-0019', employeeId: 'E-0040', type: 'sick', from: '2026-05-18', to: '2026-05-19', days: 2, status: 'approved', submittedAt: '2026-05-18' },
  { id: 'TO-0020', employeeId: 'E-0006', type: 'vacation', from: '2026-06-22', to: '2026-06-26', days: 5, status: 'approved', submittedAt: '2026-05-01', approver: 'Sarah Connor' },
  { id: 'TO-0021', employeeId: 'E-0007', type: 'vacation', from: '2026-07-27', to: '2026-08-07', days: 10, status: 'approved', submittedAt: '2026-05-08', approver: 'CEO' },

  // Historical -----------------------------------------------------------------
  { id: 'TO-0022', employeeId: 'E-0008', type: 'vacation', from: '2026-03-04', to: '2026-03-08', days: 5, status: 'approved', submittedAt: '2026-02-10', approver: 'Diane Cho' },
  { id: 'TO-0023', employeeId: 'E-0024', type: 'sick', from: '2026-04-15', to: '2026-04-16', days: 2, status: 'approved', submittedAt: '2026-04-15' },
  { id: 'TO-0024', employeeId: 'E-0036', type: 'rejected' as any, from: '2026-05-19', to: '2026-05-23', days: 5, status: 'rejected', submittedAt: '2026-05-12', approver: 'Paula Ingram', reason: 'Conflict with release week' },
  { id: 'TO-0025', employeeId: 'E-0044', type: 'vacation', from: '2026-04-01', to: '2026-04-05', days: 5, status: 'approved', submittedAt: '2026-03-10', approver: 'Laura Reed' },

  // Out-of-office today (TODAY = 2026-05-18). Spread types so the OOO
  // card surfaces vacation / sick / personal / parental tones together.
  { id: 'TO-0026', employeeId: 'E-0009', type: 'vacation', from: '2026-05-15', to: '2026-05-22', days: 6, status: 'approved', submittedAt: '2026-04-20', approver: 'Aaron Morgan', reason: 'Family holiday' },
  { id: 'TO-0027', employeeId: 'E-0013', type: 'personal', from: '2026-05-18', to: '2026-05-19', days: 2, status: 'approved', submittedAt: '2026-05-10', approver: 'Jessica Park' },
  { id: 'TO-0028', employeeId: 'E-0017', type: 'sick', from: '2026-05-17', to: '2026-05-20', days: 4, status: 'approved', submittedAt: '2026-05-17' },
  { id: 'TO-0029', employeeId: 'E-0022', type: 'vacation', from: '2026-05-14', to: '2026-05-18', days: 4, status: 'approved', submittedAt: '2026-04-25', approver: 'Kyle Newman' },
  { id: 'TO-0030', employeeId: 'E-0024', type: 'parental', from: '2026-05-04', to: '2026-07-04', days: 45, status: 'approved', submittedAt: '2026-03-12', approver: 'CEO', reason: 'Parental leave' },
  { id: 'TO-0031', employeeId: 'E-0028', type: 'vacation', from: '2026-05-18', to: '2026-05-24', days: 5, status: 'approved', submittedAt: '2026-04-30', approver: 'Naomi Tan' },
  { id: 'TO-0032', employeeId: 'E-0015', type: 'personal', from: '2026-05-18', to: '2026-05-18', days: 1, status: 'approved', submittedAt: '2026-05-15', approver: 'Liam Brooks' },
  { id: 'TO-0033', employeeId: 'E-0020', type: 'sick', from: '2026-05-18', to: '2026-05-21', days: 4, status: 'approved', submittedAt: '2026-05-18' },
]

// Some of the rejected ones picked an invalid type; clean them up.
for (const r of REQUESTS) {
  if (r.status === 'rejected' && r.type !== 'vacation' && r.type !== 'sick' && r.type !== 'personal' && r.type !== 'parental' && r.type !== 'bereavement') {
    r.type = 'vacation'
  }
}

export function findRequester(emp: TimeOffRequest): Employee | undefined {
  return EMPLOYEES.find((e) => e.id === emp.employeeId)
}

/** Return all approved requests overlapping [from, to] for the calendar view. */
export function ooOnDay(day: string): TimeOffRequest[] {
  return REQUESTS.filter((r) => r.status === 'approved' && day >= r.from && day <= r.to)
}
