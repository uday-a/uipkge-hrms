/**
 * Review cycle data for the HRMS demo.
 *
 * Single source of truth for review status across all 60 employees in
 * the directory. Cycle currently active is Q2 2026 (May 1 - May 30,
 * close-out). Two past cycles are kept for history (Q1 2026, Q4 2025)
 * so the My-reviews tab has a non-empty timeline.
 *
 * "Me" is again E-0002 (Marcus Rivera), aligned with the time-off
 * page so cross-page navigation stays coherent.
 *
 * Rating bands intentionally simple -- 5 levels mapped to Exceeds /
 * Strongly meets / Meets / Partially / Below. Real consumers swap to
 * their own ladder; the UI takes any string array.
 */

import { EMPLOYEES } from './people'

export type ReviewSection = 'self' | 'manager' | 'peer' | 'calibration' | 'complete'

export interface ReviewCycle {
  id: string
  label: string
  period: string
  selfDue: string
  managerDue: string
  closes: string
  status: 'active' | 'past' | 'upcoming'
}

export type Rating = 1 | 2 | 3 | 4 | 5

export const RATING_LABELS: Record<Rating, string> = {
  5: 'Exceeds expectations',
  4: 'Strongly meets',
  3: 'Meets expectations',
  2: 'Partially meets',
  1: 'Below expectations',
}

export const RATING_TONE: Record<Rating, string> = {
  5: 'bg-success/10 text-success border-success/20',
  4: 'bg-info/10 text-info border-info/20',
  3: 'bg-muted text-muted-foreground border-border',
  2: 'bg-warning/10 text-warning border-warning/20',
  1: 'bg-destructive/10 text-destructive border-destructive/20',
}

export interface EmployeeCycleStatus {
  employeeId: string
  cycleId: string
  selfStatus: 'not-started' | 'in-progress' | 'submitted'
  managerStatus: 'not-started' | 'in-progress' | 'submitted'
  peerCount: { invited: number; submitted: number }
  rating?: Rating
  calibratedRating?: Rating
}

export interface PeerRequest {
  id: string
  reviewerId: string // I'm writing it
  revieweeId: string // person I'm reviewing
  cycleId: string
  status: 'pending' | 'submitted'
  dueAt: string
}

export const CYCLES: ReviewCycle[] = [
  { id: 'q2-2026', label: 'Q2 2026', period: 'May 1 – Jun 30, 2026', selfDue: '2026-05-30', managerDue: '2026-06-15', closes: '2026-06-30', status: 'active' },
  { id: 'q1-2026', label: 'Q1 2026', period: 'Feb 1 – Mar 31, 2026', selfDue: '2026-02-28', managerDue: '2026-03-15', closes: '2026-03-31', status: 'past' },
  { id: 'q4-2025', label: 'Q4 2025', period: 'Nov 1 – Dec 31, 2025', selfDue: '2025-11-30', managerDue: '2025-12-15', closes: '2025-12-31', status: 'past' },
]

export const ACTIVE_CYCLE_ID = 'q2-2026'

export const ME_ID = 'E-0002'

// ── Status across the org for the active cycle ─────────────────────────────
// Hand-tuned so the demo reads as a real mid-cycle org: ~40% submitted
// self-reviews, ~15% manager reviews submitted, scattered peer counts.

const STATUS_TABLE: EmployeeCycleStatus[] = [
  { employeeId: 'E-0001', cycleId: 'q2-2026', selfStatus: 'in-progress', managerStatus: 'not-started', peerCount: { invited: 2, submitted: 0 } },
  { employeeId: 'E-0002', cycleId: 'q2-2026', selfStatus: 'in-progress', managerStatus: 'not-started', peerCount: { invited: 4, submitted: 2 } },
  { employeeId: 'E-0003', cycleId: 'q2-2026', selfStatus: 'submitted', managerStatus: 'in-progress', peerCount: { invited: 3, submitted: 3 } },
  { employeeId: 'E-0004', cycleId: 'q2-2026', selfStatus: 'submitted', managerStatus: 'submitted', peerCount: { invited: 5, submitted: 5 }, rating: 5 },
  { employeeId: 'E-0005', cycleId: 'q2-2026', selfStatus: 'submitted', managerStatus: 'in-progress', peerCount: { invited: 3, submitted: 2 } },
  { employeeId: 'E-0006', cycleId: 'q2-2026', selfStatus: 'submitted', managerStatus: 'submitted', peerCount: { invited: 4, submitted: 4 }, rating: 4 },
  { employeeId: 'E-0007', cycleId: 'q2-2026', selfStatus: 'submitted', managerStatus: 'submitted', peerCount: { invited: 5, submitted: 4 }, rating: 5 },
  { employeeId: 'E-0008', cycleId: 'q2-2026', selfStatus: 'in-progress', managerStatus: 'not-started', peerCount: { invited: 3, submitted: 1 } },
  { employeeId: 'E-0009', cycleId: 'q2-2026', selfStatus: 'submitted', managerStatus: 'in-progress', peerCount: { invited: 4, submitted: 3 } },
  { employeeId: 'E-0010', cycleId: 'q2-2026', selfStatus: 'submitted', managerStatus: 'submitted', peerCount: { invited: 3, submitted: 3 }, rating: 4 },
  { employeeId: 'E-0011', cycleId: 'q2-2026', selfStatus: 'submitted', managerStatus: 'submitted', peerCount: { invited: 4, submitted: 4 }, rating: 4 },
  { employeeId: 'E-0012', cycleId: 'q2-2026', selfStatus: 'submitted', managerStatus: 'submitted', peerCount: { invited: 5, submitted: 5 }, rating: 5 },
  { employeeId: 'E-0013', cycleId: 'q2-2026', selfStatus: 'in-progress', managerStatus: 'not-started', peerCount: { invited: 3, submitted: 2 } },
  { employeeId: 'E-0014', cycleId: 'q2-2026', selfStatus: 'submitted', managerStatus: 'submitted', peerCount: { invited: 4, submitted: 4 }, rating: 5 },
  { employeeId: 'E-0015', cycleId: 'q2-2026', selfStatus: 'not-started', managerStatus: 'not-started', peerCount: { invited: 3, submitted: 0 } },
  { employeeId: 'E-0016', cycleId: 'q2-2026', selfStatus: 'submitted', managerStatus: 'submitted', peerCount: { invited: 5, submitted: 5 }, rating: 5 },
  { employeeId: 'E-0017', cycleId: 'q2-2026', selfStatus: 'in-progress', managerStatus: 'not-started', peerCount: { invited: 2, submitted: 1 } },
  { employeeId: 'E-0018', cycleId: 'q2-2026', selfStatus: 'submitted', managerStatus: 'submitted', peerCount: { invited: 5, submitted: 5 }, rating: 4 },
  { employeeId: 'E-0019', cycleId: 'q2-2026', selfStatus: 'not-started', managerStatus: 'not-started', peerCount: { invited: 2, submitted: 0 } },
  { employeeId: 'E-0020', cycleId: 'q2-2026', selfStatus: 'in-progress', managerStatus: 'not-started', peerCount: { invited: 3, submitted: 1 } },
  { employeeId: 'E-0021', cycleId: 'q2-2026', selfStatus: 'not-started', managerStatus: 'not-started', peerCount: { invited: 3, submitted: 0 } },
  { employeeId: 'E-0022', cycleId: 'q2-2026', selfStatus: 'in-progress', managerStatus: 'not-started', peerCount: { invited: 2, submitted: 1 } },
  { employeeId: 'E-0023', cycleId: 'q2-2026', selfStatus: 'submitted', managerStatus: 'in-progress', peerCount: { invited: 4, submitted: 4 } },
  { employeeId: 'E-0024', cycleId: 'q2-2026', selfStatus: 'submitted', managerStatus: 'submitted', peerCount: { invited: 3, submitted: 3 }, rating: 3 },
  { employeeId: 'E-0025', cycleId: 'q2-2026', selfStatus: 'not-started', managerStatus: 'not-started', peerCount: { invited: 2, submitted: 0 } },
  { employeeId: 'E-0026', cycleId: 'q2-2026', selfStatus: 'in-progress', managerStatus: 'not-started', peerCount: { invited: 3, submitted: 0 } },
  { employeeId: 'E-0027', cycleId: 'q2-2026', selfStatus: 'submitted', managerStatus: 'in-progress', peerCount: { invited: 3, submitted: 2 } },
  { employeeId: 'E-0028', cycleId: 'q2-2026', selfStatus: 'in-progress', managerStatus: 'not-started', peerCount: { invited: 2, submitted: 1 } },
  { employeeId: 'E-0029', cycleId: 'q2-2026', selfStatus: 'submitted', managerStatus: 'in-progress', peerCount: { invited: 4, submitted: 3 } },
  { employeeId: 'E-0030', cycleId: 'q2-2026', selfStatus: 'not-started', managerStatus: 'not-started', peerCount: { invited: 3, submitted: 0 } },
  { employeeId: 'E-0031', cycleId: 'q2-2026', selfStatus: 'submitted', managerStatus: 'submitted', peerCount: { invited: 3, submitted: 3 }, rating: 4 },
  { employeeId: 'E-0032', cycleId: 'q2-2026', selfStatus: 'submitted', managerStatus: 'in-progress', peerCount: { invited: 4, submitted: 4 } },
  { employeeId: 'E-0033', cycleId: 'q2-2026', selfStatus: 'in-progress', managerStatus: 'not-started', peerCount: { invited: 2, submitted: 0 } },
  { employeeId: 'E-0034', cycleId: 'q2-2026', selfStatus: 'not-started', managerStatus: 'not-started', peerCount: { invited: 2, submitted: 0 } },
  { employeeId: 'E-0035', cycleId: 'q2-2026', selfStatus: 'in-progress', managerStatus: 'not-started', peerCount: { invited: 2, submitted: 1 } },
  { employeeId: 'E-0036', cycleId: 'q2-2026', selfStatus: 'in-progress', managerStatus: 'not-started', peerCount: { invited: 3, submitted: 0 } },
  { employeeId: 'E-0037', cycleId: 'q2-2026', selfStatus: 'not-started', managerStatus: 'not-started', peerCount: { invited: 3, submitted: 0 } },
  { employeeId: 'E-0038', cycleId: 'q2-2026', selfStatus: 'submitted', managerStatus: 'in-progress', peerCount: { invited: 3, submitted: 3 } },
  { employeeId: 'E-0039', cycleId: 'q2-2026', selfStatus: 'in-progress', managerStatus: 'not-started', peerCount: { invited: 2, submitted: 1 } },
  { employeeId: 'E-0040', cycleId: 'q2-2026', selfStatus: 'submitted', managerStatus: 'submitted', peerCount: { invited: 3, submitted: 3 }, rating: 3 },
  { employeeId: 'E-0041', cycleId: 'q2-2026', selfStatus: 'not-started', managerStatus: 'not-started', peerCount: { invited: 1, submitted: 0 } },
  { employeeId: 'E-0042', cycleId: 'q2-2026', selfStatus: 'not-started', managerStatus: 'not-started', peerCount: { invited: 1, submitted: 0 } },
  { employeeId: 'E-0043', cycleId: 'q2-2026', selfStatus: 'submitted', managerStatus: 'in-progress', peerCount: { invited: 3, submitted: 2 } },
  { employeeId: 'E-0044', cycleId: 'q2-2026', selfStatus: 'submitted', managerStatus: 'submitted', peerCount: { invited: 3, submitted: 3 }, rating: 4 },
  { employeeId: 'E-0045', cycleId: 'q2-2026', selfStatus: 'submitted', managerStatus: 'submitted', peerCount: { invited: 4, submitted: 4 }, rating: 4 },
  { employeeId: 'E-0046', cycleId: 'q2-2026', selfStatus: 'submitted', managerStatus: 'in-progress', peerCount: { invited: 4, submitted: 3 } },
  { employeeId: 'E-0047', cycleId: 'q2-2026', selfStatus: 'not-started', managerStatus: 'not-started', peerCount: { invited: 2, submitted: 0 } },
  { employeeId: 'E-0048', cycleId: 'q2-2026', selfStatus: 'submitted', managerStatus: 'submitted', peerCount: { invited: 4, submitted: 4 }, rating: 5 },
  { employeeId: 'E-0049', cycleId: 'q2-2026', selfStatus: 'not-started', managerStatus: 'not-started', peerCount: { invited: 1, submitted: 0 } },
  { employeeId: 'E-0050', cycleId: 'q2-2026', selfStatus: 'in-progress', managerStatus: 'not-started', peerCount: { invited: 3, submitted: 1 } },
  // E-0051 + E-0057 are offboarded -- skipped
  { employeeId: 'E-0052', cycleId: 'q2-2026', selfStatus: 'not-started', managerStatus: 'not-started', peerCount: { invited: 1, submitted: 0 } },
  { employeeId: 'E-0053', cycleId: 'q2-2026', selfStatus: 'in-progress', managerStatus: 'not-started', peerCount: { invited: 3, submitted: 2 } },
  { employeeId: 'E-0054', cycleId: 'q2-2026', selfStatus: 'submitted', managerStatus: 'in-progress', peerCount: { invited: 4, submitted: 3 } },
  { employeeId: 'E-0055', cycleId: 'q2-2026', selfStatus: 'not-started', managerStatus: 'not-started', peerCount: { invited: 1, submitted: 0 } },
  { employeeId: 'E-0056', cycleId: 'q2-2026', selfStatus: 'not-started', managerStatus: 'not-started', peerCount: { invited: 1, submitted: 0 } },
  { employeeId: 'E-0058', cycleId: 'q2-2026', selfStatus: 'in-progress', managerStatus: 'not-started', peerCount: { invited: 2, submitted: 1 } },
  { employeeId: 'E-0059', cycleId: 'q2-2026', selfStatus: 'not-started', managerStatus: 'not-started', peerCount: { invited: 2, submitted: 0 } },
  { employeeId: 'E-0060', cycleId: 'q2-2026', selfStatus: 'submitted', managerStatus: 'in-progress', peerCount: { invited: 3, submitted: 2 } },
]

export function statusForCycle(cycleId: string): EmployeeCycleStatus[] {
  return STATUS_TABLE.filter((s) => s.cycleId === cycleId)
}

export function statusFor(employeeId: string, cycleId: string = ACTIVE_CYCLE_ID): EmployeeCycleStatus | undefined {
  return STATUS_TABLE.find((s) => s.employeeId === employeeId && s.cycleId === cycleId)
}

// ── Peer review requests I (E-0002) need to write this cycle ───────────────
export const MY_PEER_REQUESTS: PeerRequest[] = [
  { id: 'PR-001', reviewerId: ME_ID, revieweeId: 'E-0006', cycleId: ACTIVE_CYCLE_ID, status: 'submitted', dueAt: '2026-05-25' },
  { id: 'PR-002', reviewerId: ME_ID, revieweeId: 'E-0009', cycleId: ACTIVE_CYCLE_ID, status: 'submitted', dueAt: '2026-05-25' },
  { id: 'PR-003', reviewerId: ME_ID, revieweeId: 'E-0024', cycleId: ACTIVE_CYCLE_ID, status: 'pending', dueAt: '2026-05-25' },
  { id: 'PR-004', reviewerId: ME_ID, revieweeId: 'E-0045', cycleId: ACTIVE_CYCLE_ID, status: 'pending', dueAt: '2026-05-25' },
]

// ── Past review summaries shown in the History card on the My tab ──────────
export interface PastReviewSummary {
  cycleId: string
  selfSubmittedAt: string
  managerName: string
  finalRating: Rating
  managerHeadline: string
}

export const MY_PAST_REVIEWS: PastReviewSummary[] = [
  { cycleId: 'q1-2026', selfSubmittedAt: '2026-02-25', managerName: 'Sarah Connor', finalRating: 4, managerHeadline: 'Shipped DS v3 milestone two weeks early. Mentoring 3 ICs, growth visible in IC4 ramp.' },
  { cycleId: 'q4-2025', selfSubmittedAt: '2025-11-28', managerName: 'Sarah Connor', finalRating: 5, managerHeadline: 'Promoted to Staff. Set the bar for cross-team accessibility work.' },
]

// ── Derived helpers ──────────────────────────────────────────────────────────
export function summary(cycleId: string = ACTIVE_CYCLE_ID) {
  const rows = statusForCycle(cycleId)
  const eligible = EMPLOYEES.filter((e) => e.status !== 'offboarded').length
  const selfSubmitted = rows.filter((r) => r.selfStatus === 'submitted').length
  const managerSubmitted = rows.filter((r) => r.managerStatus === 'submitted').length
  return {
    eligible,
    selfSubmitted,
    managerSubmitted,
    selfPct: Math.round((selfSubmitted / Math.max(1, eligible)) * 100),
    managerPct: Math.round((managerSubmitted / Math.max(1, eligible)) * 100),
  }
}

// Rating distribution by department -- only counts employees with a
// final calibrated rating (or current rating fallback).
export function calibrationGrid(cycleId: string = ACTIVE_CYCLE_ID): {
  department: string
  byRating: Record<Rating, number>
  total: number
}[] {
  const rows = statusForCycle(cycleId)
  const byDept = new Map<string, Record<Rating, number>>()
  for (const r of rows) {
    const rating = r.calibratedRating ?? r.rating
    if (!rating) continue
    const emp = EMPLOYEES.find((e) => e.id === r.employeeId)
    if (!emp) continue
    const bucket = byDept.get(emp.department) ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    bucket[rating] += 1
    byDept.set(emp.department, bucket)
  }
  return Array.from(byDept.entries()).map(([department, byRating]) => ({
    department,
    byRating,
    total: byRating[1] + byRating[2] + byRating[3] + byRating[4] + byRating[5],
  }))
}
