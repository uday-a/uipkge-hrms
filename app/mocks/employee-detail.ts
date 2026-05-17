/**
 * Per-employee detail layer. Keys off the same Employee.id from
 * mocks/people.ts so the directory and profile page share a canonical
 * row. Profile-only fields (bio, skills, PTO history, documents,
 * activity) live here so the people list stays light to ship over SSR.
 *
 * Two layers:
 *   1. A small map of id -> richer detail for ~6 hand-tuned profiles.
 *      These get the polished story across all four tabs.
 *   2. `getEmployeeDetail(id)` falls back to a generic generator that
 *      derives reasonable defaults from the base Employee record so any
 *      of the 60 ids returns a usable profile page (no 404, no holes).
 */

import { EMPLOYEES, type Employee } from './people'

export interface PtoBalance {
  vacation: { used: number; total: number }
  sick: { used: number; total: number }
  personal: { used: number; total: number }
}

export interface PtoLedgerEntry {
  id: string
  type: 'vacation' | 'sick' | 'personal'
  from: string
  to: string
  days: number
  status: 'approved' | 'pending' | 'cancelled'
  approver?: string
}

export interface DocumentEntry {
  id: string
  name: string
  category: 'contract' | 'tax' | 'policy' | 'benefit' | 'review'
  signedAt?: string
  sizeKb: number
}

export interface ActivityEntry {
  id: string
  day: string
  time: string
  type: 'doc' | 'pto' | 'role' | 'review' | 'kudos'
  text: string
  meta?: string
}

export interface EmployeeDetail {
  bio: string
  pronouns?: string
  phone?: string
  timezone: string
  birthday?: string
  workAnniversary?: string
  skills: string[]
  reportsToId?: string
  directReports: string[]
  reviewCycle: { period: string; status: 'self' | 'manager' | 'calibration' | 'complete'; due: string }
  pto: PtoBalance
  ptoLedger: PtoLedgerEntry[]
  documents: DocumentEntry[]
  activity: ActivityEntry[]
  goals: { label: string; progress: number; due: string }[]
}

// ── Polished detail for the showcase profiles ───────────────────────────────
const DETAIL_MAP: Record<string, EmployeeDetail> = {
  'E-0001': {
    bio: 'Joined April 2026 from Razorpay. Senior backend engineer focused on payments + ledger systems. Speaks Hindi, Tamil, English.',
    pronouns: 'she/her',
    phone: '+91 98765 43210',
    timezone: 'America/Los_Angeles',
    birthday: '06-14',
    workAnniversary: '2026-04-25',
    skills: ['Go', 'Postgres', 'Distributed systems', 'gRPC', 'Kubernetes'],
    reportsToId: 'E-0004',
    directReports: [],
    reviewCycle: { period: 'Q2 2026', status: 'self', due: '2026-05-30' },
    pto: {
      vacation: { used: 0, total: 20 },
      sick: { used: 0, total: 10 },
      personal: { used: 0, total: 4 },
    },
    ptoLedger: [],
    documents: [
      { id: 'd1', name: 'Offer letter', category: 'contract', signedAt: '2026-04-22', sizeKb: 184 },
      { id: 'd2', name: 'Confidentiality agreement', category: 'contract', signedAt: '2026-04-22', sizeKb: 92 },
      { id: 'd3', name: 'W-2', category: 'tax', sizeKb: 0 },
      { id: 'd4', name: 'Code of conduct', category: 'policy', signedAt: '2026-04-25', sizeKb: 412 },
    ],
    activity: [
      { id: 'a1', day: 'Today', time: '09:14', type: 'role', text: 'started at Engineering · Senior Backend' },
      { id: 'a2', day: 'Today', time: '09:18', type: 'doc', text: 'signed Code of conduct' },
      { id: 'a3', day: 'Apr 24, 2026', time: '11:00', type: 'doc', text: 'completed onboarding paperwork' },
    ],
    goals: [
      { label: 'Ramp on ledger codebase', progress: 15, due: '2026-06-30' },
      { label: 'Ship first PR', progress: 0, due: '2026-05-15' },
      { label: 'Complete security training', progress: 25, due: '2026-05-30' },
    ],
  },
  'E-0002': {
    bio: 'Staff frontend engineer leading the design-system rewrite. Joined 2024 from Vercel. Mentors L4-L5 engineers across NY + San Francisco.',
    pronouns: 'he/him',
    phone: '+1 (212) 555-0142',
    timezone: 'America/New_York',
    birthday: '11-03',
    workAnniversary: '2024-08-12',
    skills: ['TypeScript', 'Vue', 'React', 'Design systems', 'Accessibility', 'Storybook'],
    reportsToId: 'E-0004',
    directReports: ['E-0021', 'E-0026', 'E-0037'],
    reviewCycle: { period: 'Q2 2026', status: 'manager', due: '2026-05-30' },
    pto: {
      vacation: { used: 8, total: 25 },
      sick: { used: 2, total: 10 },
      personal: { used: 1, total: 4 },
    },
    ptoLedger: [
      { id: 'p1', type: 'vacation', from: '2026-03-09', to: '2026-03-13', days: 5, status: 'approved', approver: 'Sarah Connor' },
      { id: 'p2', type: 'sick', from: '2026-02-04', to: '2026-02-05', days: 2, status: 'approved' },
      { id: 'p3', type: 'vacation', from: '2025-12-22', to: '2025-12-26', days: 3, status: 'approved', approver: 'Sarah Connor' },
      { id: 'p4', type: 'vacation', from: '2026-06-15', to: '2026-06-19', days: 5, status: 'pending' },
    ],
    documents: [
      { id: 'd1', name: 'Offer letter 2024', category: 'contract', signedAt: '2024-08-01', sizeKb: 198 },
      { id: 'd2', name: 'Promotion letter 2025', category: 'contract', signedAt: '2025-09-10', sizeKb: 142 },
      { id: 'd3', name: 'W-2 2025', category: 'tax', signedAt: '2026-01-31', sizeKb: 78 },
      { id: 'd4', name: 'Stock option agreement', category: 'benefit', signedAt: '2024-08-01', sizeKb: 312 },
      { id: 'd5', name: 'Q1 2026 review', category: 'review', signedAt: '2026-02-15', sizeKb: 124 },
    ],
    activity: [
      { id: 'a1', day: 'Today', time: '10:22', type: 'pto', text: 'requested PTO Jun 15 – 19', meta: '5 working days' },
      { id: 'a2', day: 'Yesterday', time: '15:40', type: 'kudos', text: 'received kudos from Aaron Morgan', meta: 'Design-system v3 ship' },
      { id: 'a3', day: 'Apr 22, 2026', time: '09:00', type: 'review', text: 'manager review submitted by Sarah Connor' },
      { id: 'a4', day: 'Apr 18, 2026', time: '14:30', type: 'doc', text: 'signed updated security policy' },
    ],
    goals: [
      { label: 'Design-system v3 GA', progress: 78, due: '2026-06-30' },
      { label: 'Mentor 3 mid-level engineers', progress: 65, due: '2026-12-31' },
      { label: 'Public conf talk on accessibility', progress: 40, due: '2026-09-30' },
    ],
  },
  'E-0004': {
    bio: 'VP Engineering. Built and scaled the engineering org from 12 to 124 across 3 years. Direct line to CEO.',
    pronouns: 'she/her',
    phone: '+91 99450 12345',
    timezone: 'America/Los_Angeles',
    birthday: '02-28',
    workAnniversary: '2022-06-20',
    skills: ['Engineering management', 'Architecture', 'Hiring', 'Strategy', 'Mentorship'],
    directReports: ['E-0006', 'E-0009', 'E-0010', 'E-0024', 'E-0027', 'E-0030', 'E-0048'],
    reviewCycle: { period: 'Q2 2026', status: 'calibration', due: '2026-05-30' },
    pto: {
      vacation: { used: 12, total: 30 },
      sick: { used: 0, total: 10 },
      personal: { used: 2, total: 4 },
    },
    ptoLedger: [
      { id: 'p1', type: 'vacation', from: '2026-01-02', to: '2026-01-12', days: 7, status: 'approved' },
      { id: 'p2', type: 'vacation', from: '2026-04-10', to: '2026-04-14', days: 5, status: 'approved' },
    ],
    documents: [
      { id: 'd1', name: 'Executive offer letter', category: 'contract', signedAt: '2022-06-01', sizeKb: 256 },
      { id: 'd2', name: 'Founders RSU agreement', category: 'benefit', signedAt: '2022-06-01', sizeKb: 412 },
      { id: 'd3', name: 'W-2 2025', category: 'tax', signedAt: '2026-04-10', sizeKb: 89 },
    ],
    activity: [
      { id: 'a1', day: 'Today', time: '08:45', type: 'review', text: 'approved 12 Q2 calibration recommendations' },
      { id: 'a2', day: 'Yesterday', time: '17:00', type: 'role', text: 'promoted Paula Ingram to Staff Engineer' },
    ],
    goals: [
      { label: 'Eng headcount 140 by Q3', progress: 71, due: '2026-09-30' },
      { label: 'Reduce P0 incidents 30%', progress: 55, due: '2026-12-31' },
    ],
  },
  'E-0007': {
    bio: 'Head of Design. Built the design org from scratch starting Nov 2022. Author of the uipkge design language.',
    pronouns: 'she/her',
    phone: '+44 20 7946 0958',
    timezone: 'Europe/London',
    birthday: '07-19',
    workAnniversary: '2022-11-08',
    skills: ['Design leadership', 'Design systems', 'Brand', 'Typography', 'Research'],
    directReports: ['E-0005', 'E-0019', 'E-0039', 'E-0044'],
    reviewCycle: { period: 'Q2 2026', status: 'manager', due: '2026-05-30' },
    pto: {
      vacation: { used: 6, total: 28 },
      sick: { used: 1, total: 10 },
      personal: { used: 1, total: 4 },
    },
    ptoLedger: [
      { id: 'p1', type: 'vacation', from: '2026-02-12', to: '2026-02-19', days: 6, status: 'approved' },
    ],
    documents: [
      { id: 'd1', name: 'Offer letter', category: 'contract', signedAt: '2022-10-20', sizeKb: 198 },
      { id: 'd2', name: 'RSU agreement', category: 'benefit', signedAt: '2022-11-08', sizeKb: 298 },
    ],
    activity: [
      { id: 'a1', day: 'Today', time: '11:15', type: 'kudos', text: 'gave kudos to Kyle Newman', meta: 'Onboarding redesign' },
      { id: 'a2', day: 'Yesterday', time: '14:00', type: 'review', text: 'submitted manager reviews for design org' },
    ],
    goals: [
      { label: 'Design language v2 launch', progress: 82, due: '2026-08-15' },
      { label: 'Hire senior researcher', progress: 30, due: '2026-07-31' },
    ],
  },
  'E-0008': {
    bio: 'Senior PM owning the activations + retention surfaces. Joined from Stripe Mar 2023. Speaks English, Hindi, Marathi.',
    pronouns: 'he/him',
    phone: '+91 90123 45678',
    timezone: 'America/Los_Angeles',
    birthday: '09-04',
    workAnniversary: '2023-05-22',
    skills: ['Product strategy', 'Analytics', 'A/B testing', 'Pricing', 'User research'],
    reportsToId: 'E-0003',
    directReports: ['E-0023', 'E-0046', 'E-0053'],
    reviewCycle: { period: 'Q2 2026', status: 'self', due: '2026-05-30' },
    pto: {
      vacation: { used: 5, total: 22 },
      sick: { used: 1, total: 10 },
      personal: { used: 0, total: 4 },
    },
    ptoLedger: [
      { id: 'p1', type: 'vacation', from: '2026-03-04', to: '2026-03-08', days: 5, status: 'approved' },
    ],
    documents: [
      { id: 'd1', name: 'Offer letter', category: 'contract', signedAt: '2023-05-10', sizeKb: 174 },
      { id: 'd2', name: 'IP assignment', category: 'contract', signedAt: '2023-05-22', sizeKb: 88 },
      { id: 'd3', name: 'Q1 2026 review', category: 'review', signedAt: '2026-02-20', sizeKb: 132 },
    ],
    activity: [
      { id: 'a1', day: 'Today', time: '09:30', type: 'doc', text: 'submitted Q2 PRD for review' },
      { id: 'a2', day: 'Yesterday', time: '16:00', type: 'review', text: 'completed self-review for Q2 cycle' },
    ],
    goals: [
      { label: 'Activation +15% by Q3', progress: 48, due: '2026-09-30' },
      { label: 'Launch pricing v2', progress: 60, due: '2026-07-31' },
    ],
  },
}

// ── Default generator for the long tail ─────────────────────────────────────
function defaultDetail(emp: Employee): EmployeeDetail {
  const reportsTo = EMPLOYEES.find((e) => e.name === emp.manager)
  const reports = EMPLOYEES.filter((e) => e.manager === emp.name).map((e) => e.id)
  return {
    bio: `${emp.title.replace(/ Engineer$/, ' engineer')} on the ${emp.department} team, based in ${emp.location}. Joined ${emp.startDate}.`,
    pronouns: undefined,
    timezone: emp.location === 'San Francisco' ? 'America/Los_Angeles' : emp.location === 'London' ? 'Europe/London' : emp.location === 'Berlin' ? 'Europe/Berlin' : emp.location === 'Sydney' ? 'Australia/Sydney' : emp.location === 'New York' ? 'America/New_York' : 'UTC',
    workAnniversary: emp.startDate,
    skills: defaultSkillsFor(emp.department),
    reportsToId: reportsTo?.id,
    directReports: reports,
    reviewCycle: { period: 'Q2 2026', status: 'self', due: '2026-05-30' },
    pto: {
      vacation: { used: Math.min(emp.tenureMonths, 18), total: 22 },
      sick: { used: Math.min(Math.max(0, emp.tenureMonths - 12), 6), total: 10 },
      personal: { used: Math.min(emp.tenureMonths > 6 ? 1 : 0, 4), total: 4 },
    },
    ptoLedger: emp.status === 'on-leave'
      ? [{ id: 'p1', type: 'vacation', from: '2026-05-12', to: '2026-05-18', days: 5, status: 'approved' as const, approver: emp.manager }]
      : [],
    documents: [
      { id: 'd1', name: 'Offer letter', category: 'contract', signedAt: emp.startDate, sizeKb: 180 },
      { id: 'd2', name: 'Confidentiality agreement', category: 'contract', signedAt: emp.startDate, sizeKb: 92 },
      { id: 'd3', name: 'Code of conduct', category: 'policy', signedAt: emp.startDate, sizeKb: 412 },
    ],
    activity: [
      { id: 'a1', day: 'Apr 22, 2026', time: '10:00', type: 'doc', text: 'signed updated security policy' },
    ],
    goals: [
      { label: `Hit Q2 ${emp.department} milestone`, progress: 45, due: '2026-06-30' },
    ],
  }
}

function defaultSkillsFor(dept: string): string[] {
  switch (dept) {
    case 'Engineering': return ['TypeScript', 'Code review', 'System design']
    case 'Design': return ['Figma', 'Design systems', 'Prototyping']
    case 'Product': return ['Roadmapping', 'Analytics', 'User research']
    case 'Sales': return ['Discovery', 'Negotiation', 'Salesforce']
    case 'Marketing': return ['Content', 'SEO', 'Brand']
    case 'Finance': return ['FP&A', 'Reporting', 'Excel']
    case 'People': return ['Recruiting', 'Coaching', 'L&D']
    case 'Operations': return ['Process', 'Vendor mgmt', 'Analytics']
    default: return []
  }
}

export function getEmployeeDetail(id: string): EmployeeDetail | undefined {
  const emp = EMPLOYEES.find((e) => e.id === id)
  if (!emp) return undefined
  return DETAIL_MAP[id] ?? defaultDetail(emp)
}

export const REVIEW_STATUS_LABELS: Record<EmployeeDetail['reviewCycle']['status'], string> = {
  self: 'Self-review pending',
  manager: 'Manager review pending',
  calibration: 'In calibration',
  complete: 'Complete',
}

export const DOC_CATEGORY_LABELS: Record<DocumentEntry['category'], string> = {
  contract: 'Contracts',
  tax: 'Tax',
  policy: 'Policies',
  benefit: 'Benefits',
  review: 'Reviews',
}
