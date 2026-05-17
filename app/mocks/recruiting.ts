/**
 * Recruiting pipeline data.
 *
 * Single source for both:
 *   - Hero KPI tiles (open reqs, candidates in pipeline, time-to-hire,
 *     offer acceptance rate)
 *   - 5-column kanban: Applied / Screened / Interviewed / Offer / Hired
 *
 * Stages are sized so the funnel matches the dashboard's hiring-funnel
 * chart: 482 / 184 / 64 / 22 / 12. We don't render every record (482
 * cards on Applied would overwhelm the column), so the mock surfaces
 * a representative sample per stage and prints the actual count in
 * the column header.
 */

import { EMPLOYEES } from './people'

export type Stage = 'applied' | 'screened' | 'interviewed' | 'offer' | 'hired'

export const STAGE_LABELS: Record<Stage, string> = {
  applied: 'Applied',
  screened: 'Screened',
  interviewed: 'Interviewed',
  offer: 'Offer',
  hired: 'Hired',
}

export const STAGE_TONE: Record<Stage, string> = {
  applied: 'bg-muted text-muted-foreground border-border',
  screened: 'bg-info/10 text-info border-info/20',
  interviewed: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  offer: 'bg-warning/10 text-warning border-warning/20',
  hired: 'bg-success/10 text-success border-success/20',
}

export const STAGE_DOT_TONE: Record<Stage, string> = {
  applied: 'bg-muted-foreground',
  screened: 'bg-info',
  interviewed: 'bg-chart-3',
  offer: 'bg-warning',
  hired: 'bg-success',
}

export const STAGE_TOTALS: Record<Stage, number> = {
  applied: 482,
  screened: 184,
  interviewed: 64,
  offer: 22,
  hired: 12,
}

export interface Requisition {
  id: string
  title: string
  department: string
  level: string
  location: string
  hiringManagerId: string
  recruiterId: string
  opened: string
  status: 'open' | 'filled' | 'on-hold'
  openings: number
  totalCandidates: number
}

export const REQUISITIONS: Requisition[] = [
  { id: 'REQ-2026-001', title: 'Senior Backend Engineer', department: 'Engineering', level: 'L5', location: 'San Francisco', hiringManagerId: 'E-0048', recruiterId: 'E-0035', opened: '2026-02-12', status: 'open', openings: 3, totalCandidates: 142 },
  { id: 'REQ-2026-002', title: 'Engineering Manager', department: 'Engineering', level: 'M5', location: 'New York', hiringManagerId: 'E-0004', recruiterId: 'E-0003', opened: '2026-01-20', status: 'open', openings: 1, totalCandidates: 64 },
  { id: 'REQ-2026-003', title: 'Senior Product Designer', department: 'Design', level: 'L5', location: 'London', hiringManagerId: 'E-0007', recruiterId: 'E-0031', opened: '2026-02-28', status: 'open', openings: 2, totalCandidates: 98 },
  { id: 'REQ-2026-004', title: 'Senior PM', department: 'Product', level: 'L5', location: 'San Francisco', hiringManagerId: 'E-0008', recruiterId: 'E-0035', opened: '2026-03-15', status: 'open', openings: 1, totalCandidates: 51 },
  { id: 'REQ-2026-005', title: 'Site Reliability Engineer', department: 'Engineering', level: 'L4', location: 'Remote', hiringManagerId: 'E-0010', recruiterId: 'E-0049', opened: '2026-04-02', status: 'open', openings: 2, totalCandidates: 89 },
  { id: 'REQ-2026-006', title: 'Account Executive', department: 'Sales', level: 'L4', location: 'New York', hiringManagerId: 'E-0012', recruiterId: 'E-0056', opened: '2026-04-09', status: 'open', openings: 4, totalCandidates: 38 },
  { id: 'REQ-2026-007', title: 'Marketing Designer', department: 'Marketing', level: 'L3', location: 'Berlin', hiringManagerId: 'E-0014', recruiterId: 'E-0056', opened: '2026-04-20', status: 'on-hold', openings: 1, totalCandidates: 22 },
  { id: 'REQ-2026-008', title: 'Junior Frontend Engineer', department: 'Engineering', level: 'L3', location: 'San Francisco', hiringManagerId: 'E-0002', recruiterId: 'E-0035', opened: '2026-05-01', status: 'open', openings: 2, totalCandidates: 18 },
]

export interface Candidate {
  id: string
  name: string
  initials: string
  email: string
  requisitionId: string
  stage: Stage
  source: 'Referral' | 'LinkedIn' | 'Inbound' | 'Recruiter' | 'Outbound'
  appliedAt: string
  stageEnteredAt: string
  rating?: number // 1..5
  notes?: string
  nextStep?: string
}

// 24 candidates spread across 5 stages so each column shows a few.
// Cards are stable (no random), names lean global so avatars vary.
export const CANDIDATES: Candidate[] = [
  // Applied (column shows 6 sample of 482)
  { id: 'CAND-001', name: 'Abby Bennett', initials: 'AB', email: 'abby.b@example.com', requisitionId: 'REQ-2026-001', stage: 'applied', source: 'LinkedIn', appliedAt: '2026-05-15', stageEnteredAt: '2026-05-15', rating: 4 },
  { id: 'CAND-002', name: 'Ryan Scott', initials: 'RS', email: 'ryan.scott@example.com', requisitionId: 'REQ-2026-001', stage: 'applied', source: 'Inbound', appliedAt: '2026-05-16', stageEnteredAt: '2026-05-16' },
  { id: 'CAND-003', name: 'Marta Lopez', initials: 'ML', email: 'marta@example.com', requisitionId: 'REQ-2026-003', stage: 'applied', source: 'Referral', appliedAt: '2026-05-13', stageEnteredAt: '2026-05-13', rating: 5, notes: 'Referred by Laura Reed' },
  { id: 'CAND-004', name: 'Tomas Larsen', initials: 'TL', email: 'tomas@example.com', requisitionId: 'REQ-2026-005', stage: 'applied', source: 'LinkedIn', appliedAt: '2026-05-14', stageEnteredAt: '2026-05-14' },
  { id: 'CAND-005', name: 'Yui Hashimoto', initials: 'YH', email: 'yui@example.com', requisitionId: 'REQ-2026-002', stage: 'applied', source: 'Outbound', appliedAt: '2026-05-12', stageEnteredAt: '2026-05-12', rating: 4 },
  { id: 'CAND-006', name: 'Daria Volkova', initials: 'DV', email: 'daria@example.com', requisitionId: 'REQ-2026-004', stage: 'applied', source: 'Inbound', appliedAt: '2026-05-17', stageEnteredAt: '2026-05-17' },

  // Screened (sample 5 of 184)
  { id: 'CAND-007', name: 'Anna Irwin', initials: 'AI', email: 'anna.irwin@example.com', requisitionId: 'REQ-2026-001', stage: 'screened', source: 'Recruiter', appliedAt: '2026-05-04', stageEnteredAt: '2026-05-10', rating: 4, nextStep: 'Coding screen scheduled May 21' },
  { id: 'CAND-008', name: 'Brian Murphy', initials: 'BM', email: 'brian.murphy@example.com', requisitionId: 'REQ-2026-002', stage: 'screened', source: 'LinkedIn', appliedAt: '2026-04-28', stageEnteredAt: '2026-05-11', rating: 5, nextStep: 'Hiring manager call May 20' },
  { id: 'CAND-009', name: 'Sara Mitchell', initials: 'SM', email: 'sara.m@example.com', requisitionId: 'REQ-2026-003', stage: 'screened', source: 'Referral', appliedAt: '2026-05-02', stageEnteredAt: '2026-05-09', rating: 4 },
  { id: 'CAND-010', name: 'Owen Lambert', initials: 'OL', email: 'owen.l@example.com', requisitionId: 'REQ-2026-005', stage: 'screened', source: 'Recruiter', appliedAt: '2026-04-30', stageEnteredAt: '2026-05-08', rating: 3 },
  { id: 'CAND-011', name: 'Paige Jordan', initials: 'PJ', email: 'paige.jordan@example.com', requisitionId: 'REQ-2026-001', stage: 'screened', source: 'Referral', appliedAt: '2026-05-01', stageEnteredAt: '2026-05-12', rating: 5, notes: 'Strong system design background' },

  // Interviewed (sample 5 of 64)
  { id: 'CAND-012', name: 'Felipe Costa', initials: 'FC', email: 'felipe.costa@example.com', requisitionId: 'REQ-2026-001', stage: 'interviewed', source: 'LinkedIn', appliedAt: '2026-04-15', stageEnteredAt: '2026-05-05', rating: 4, nextStep: 'Onsite May 22' },
  { id: 'CAND-013', name: 'Hannah Park', initials: 'HP', email: 'hannah.park@example.com', requisitionId: 'REQ-2026-002', stage: 'interviewed', source: 'Outbound', appliedAt: '2026-04-10', stageEnteredAt: '2026-05-02', rating: 5, nextStep: 'Founder loop May 19' },
  { id: 'CAND-014', name: 'Victor Sanders', initials: 'VS', email: 'vikram@example.com', requisitionId: 'REQ-2026-004', stage: 'interviewed', source: 'Referral', appliedAt: '2026-04-12', stageEnteredAt: '2026-05-04', rating: 4 },
  { id: 'CAND-015', name: 'Emilia Russo', initials: 'ER', email: 'emilia@example.com', requisitionId: 'REQ-2026-003', stage: 'interviewed', source: 'Recruiter', appliedAt: '2026-04-08', stageEnteredAt: '2026-04-30', rating: 5, notes: 'Portfolio strongest seen this quarter', nextStep: 'Founder loop May 21' },
  { id: 'CAND-016', name: 'Daniel Achebe', initials: 'DA', email: 'daniel.a@example.com', requisitionId: 'REQ-2026-005', stage: 'interviewed', source: 'Inbound', appliedAt: '2026-04-18', stageEnteredAt: '2026-05-06', rating: 4 },

  // Offer (sample 4 of 22)
  { id: 'CAND-017', name: 'Adam Knox', initials: 'AK', email: 'adam.k@example.com', requisitionId: 'REQ-2026-001', stage: 'offer', source: 'LinkedIn', appliedAt: '2026-03-20', stageEnteredAt: '2026-05-12', rating: 5, nextStep: 'Verbal accepted, paperwork May 19' },
  { id: 'CAND-018', name: 'Lena Brandt', initials: 'LB', email: 'lena@example.com', requisitionId: 'REQ-2026-002', stage: 'offer', source: 'Outbound', appliedAt: '2026-03-15', stageEnteredAt: '2026-05-08', rating: 5, notes: 'Counter expected from Stripe, decision May 22' },
  { id: 'CAND-019', name: 'Miguel Reyes', initials: 'MR', email: 'miguel.r@example.com', requisitionId: 'REQ-2026-004', stage: 'offer', source: 'Referral', appliedAt: '2026-03-22', stageEnteredAt: '2026-05-11', rating: 4 },
  { id: 'CAND-020', name: 'Chiamaka Okafor', initials: 'CO', email: 'chia@example.com', requisitionId: 'REQ-2026-003', stage: 'offer', source: 'Recruiter', appliedAt: '2026-03-28', stageEnteredAt: '2026-05-13', rating: 5, nextStep: 'Awaiting signed offer letter' },

  // Hired (sample 4 of 12) -- these become future employees
  { id: 'CAND-021', name: 'Sebastian Klein', initials: 'SK', email: 'sebastian@example.com', requisitionId: 'REQ-2026-001', stage: 'hired', source: 'LinkedIn', appliedAt: '2026-02-25', stageEnteredAt: '2026-05-02', rating: 5, nextStep: 'Start date Jun 1' },
  { id: 'CAND-022', name: 'Holly Stevens', initials: 'HS', email: 'holly.s@example.com', requisitionId: 'REQ-2026-002', stage: 'hired', source: 'Referral', appliedAt: '2026-02-18', stageEnteredAt: '2026-04-28', rating: 5, nextStep: 'Start date May 26' },
  { id: 'CAND-023', name: 'Adriana Mendes', initials: 'AM', email: 'adriana@example.com', requisitionId: 'REQ-2026-005', stage: 'hired', source: 'Outbound', appliedAt: '2026-02-22', stageEnteredAt: '2026-04-30', rating: 4, nextStep: 'Background check in progress' },
  { id: 'CAND-024', name: 'Niko Tanaka', initials: 'NT', email: 'niko@example.com', requisitionId: 'REQ-2026-006', stage: 'hired', source: 'Recruiter', appliedAt: '2026-03-02', stageEnteredAt: '2026-05-05', rating: 5, nextStep: 'Start date Jun 8' },
]

export const SOURCE_TONE: Record<Candidate['source'], string> = {
  Referral: 'bg-success/10 text-success',
  LinkedIn: 'bg-info/10 text-info',
  Inbound: 'bg-muted text-muted-foreground',
  Recruiter: 'bg-chart-3/10 text-chart-3',
  Outbound: 'bg-warning/10 text-warning',
}

export function findReq(id: string): Requisition | undefined {
  return REQUISITIONS.find((r) => r.id === id)
}

export function daysSince(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  const date = Date.UTC(y!, m! - 1, d!)
  const today = Date.UTC(2026, 4, 18) // 2026-05-18, matches the rest of the demo
  return Math.max(0, Math.round((today - date) / 86400000))
}

export function findHiringManager(req: Requisition) {
  return EMPLOYEES.find((e) => e.id === req.hiringManagerId)
}

export function findRecruiter(req: Requisition) {
  return EMPLOYEES.find((e) => e.id === req.recruiterId)
}

// ── Pipeline metrics ────────────────────────────────────────────────────────
export const TIME_TO_HIRE_DAYS = 38 // 7-day rolling average across recent hires
export const OFFER_ACCEPTANCE_RATE = 86 // % accepted across last 4 weeks
export const PIPELINE_BY_DEPT = [
  { dept: 'Engineering', candidates: 297, openReqs: 4 },
  { dept: 'Design', candidates: 98, openReqs: 1 },
  { dept: 'Product', candidates: 51, openReqs: 1 },
  { dept: 'Sales', candidates: 38, openReqs: 1 },
  { dept: 'Marketing', candidates: 22, openReqs: 1 },
]
