/**
 * HR-specific inbox notifications. Single thread per item (these are
 * system + people-driven nudges, not back-and-forth conversations --
 * conversations live on /chat).
 *
 * Mix designed so a viewer sees:
 *   - actionable items at the top (review due, time-off requested)
 *   - recently approved items below them
 *   - older completed/announcement-style items at the bottom
 */

import { EMPLOYEES, findEmployee } from './people'

export type InboxType =
  | 'review-due'
  | 'time-off-request'
  | 'time-off-approved'
  | 'time-off-rejected'
  | 'peer-feedback'
  | 'offer-sent'
  | 'offer-accepted'
  | 'doc-signed'
  | 'mention'
  | 'announcement'
  | 'birthday'

export interface InboxItem {
  id: string
  type: InboxType
  fromId?: string
  title: string
  preview: string
  body: string
  day: string
  time: string
  unread: boolean
  starred?: boolean
  actionable?: { label: string; href?: string }[]
}

export const TYPE_LABELS: Record<InboxType, string> = {
  'review-due': 'Review',
  'time-off-request': 'Time off',
  'time-off-approved': 'Time off',
  'time-off-rejected': 'Time off',
  'peer-feedback': 'Peer feedback',
  'offer-sent': 'Recruiting',
  'offer-accepted': 'Recruiting',
  'doc-signed': 'Documents',
  mention: 'Mention',
  announcement: 'Announcement',
  birthday: 'People',
}

export const TYPE_TONE: Record<InboxType, string> = {
  'review-due': 'bg-warning/10 text-warning border-warning/20',
  'time-off-request': 'bg-info/10 text-info border-info/20',
  'time-off-approved': 'bg-success/10 text-success border-success/20',
  'time-off-rejected': 'bg-destructive/10 text-destructive border-destructive/20',
  'peer-feedback': 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  'offer-sent': 'bg-warning/10 text-warning border-warning/20',
  'offer-accepted': 'bg-success/10 text-success border-success/20',
  'doc-signed': 'bg-muted text-muted-foreground border-border',
  mention: 'bg-chart-1/10 text-chart-1 border-chart-1/20',
  announcement: 'bg-muted text-muted-foreground border-border',
  birthday: 'bg-chart-5/10 text-chart-5 border-chart-5/20',
}

export const INBOX_ITEMS: InboxItem[] = [
  { id: 'i1', type: 'review-due', title: 'Q2 self-review due May 30', preview: 'You have 12 days left to submit your Q2 2026 self-review.', body: 'Submit by May 30. Manager review opens June 1 and your peer requests close on the same day. Saving a draft auto-syncs across devices.', day: 'Today', time: '09:14', unread: true, actionable: [{ label: 'Open self-review', href: '/reviews' }] },
  { id: 'i2', type: 'time-off-approved', fromId: 'E-0004', title: 'PTO request Mar 9-13 approved', preview: 'Sarah Connor approved your vacation request.', body: 'Hi Marcus — approved. Have a great trip. Please make sure your handoff doc covers the design-system rollout window. — Sarah', day: 'Today', time: '10:22', unread: true, actionable: [{ label: 'View ledger', href: '/time-off' }] },
  { id: 'i3', type: 'peer-feedback', fromId: 'E-0006', title: 'New peer feedback request', preview: 'Aaron asked you to write a peer review for Paula Ingram.', body: 'Please complete by May 25. The form is short: 3 questions on strengths, areas to develop, and a single overall rating.', day: 'Today', time: '11:47', unread: true, actionable: [{ label: 'Write peer review', href: '/reviews' }] },
  { id: 'i4', type: 'offer-sent', title: 'Offer accepted: Lena Brandt', preview: 'Engineering Manager candidate accepted offer. Start date Jun 2.', body: 'Lena countersigned this morning. Onboarding flow auto-created. Buddy assignment recommended — currently Aaron Morgan. Comp summary attached.', day: 'Yesterday', time: '15:08', unread: false, starred: true, actionable: [{ label: 'Open profile', href: '/people' }] },
  { id: 'i5', type: 'mention', fromId: 'E-0007', title: 'Mention in #design-systems', preview: 'Laura tagged you on the v3 tokens spec.', body: 'Hey Marcus — can you weigh in on the chart-1..5 token decision before EOW? I want to lock the OKLCH lightness band before the Berlin team picks it up. Thread link in chat.', day: 'Yesterday', time: '12:00', unread: false, actionable: [{ label: 'Open chat thread', href: '/chat' }] },
  { id: 'i6', type: 'doc-signed', title: 'Updated security policy signed', preview: 'You signed the May 2026 security policy.', body: 'Confirmation: 2026 security policy v2.3 signed Apr 18 at 14:30. Next mandatory training: Q3 phishing simulation.', day: 'Yesterday', time: '09:35', unread: false },
  { id: 'i7', type: 'birthday', fromId: 'E-0008', title: 'Mark Vincent turns 36 tomorrow', preview: 'Send a quick note to wish him.', body: 'Tomorrow is Mark Vincent\'s birthday. He\'s based in San Francisco and prefers low-key acknowledgements — a one-line note in chat works great.', day: 'Apr 22, 2026', time: '08:00', unread: false, actionable: [{ label: 'Open chat with Mark', href: '/chat' }] },
  { id: 'i8', type: 'announcement', title: 'New: parental leave policy', preview: '16 weeks paid for primary caregivers, 8 weeks for secondary, effective Jul 1.', body: 'Full policy doc attached. Highlights:\n• 16 weeks paid for primary caregiver\n• 8 weeks paid for secondary caregiver\n• Adoption + surrogacy covered the same as birth parent\n• Phase-back option of 4 weeks at 60% time\n\nQuestions: people-team@uipkge-hrms.dev', day: 'Apr 21, 2026', time: '10:00', unread: false, actionable: [{ label: 'Read full policy', href: '/settings' }] },
  { id: 'i9', type: 'time-off-rejected', fromId: 'E-0004', title: 'Time off request not approved', preview: 'Conflict with release week.', body: 'Hi Marcus — I can\'t approve the May 19-23 PTO because that overlaps the v3 launch. Could we push it to the following week? Happy to discuss in 1:1.', day: 'Apr 20, 2026', time: '16:30', unread: false, actionable: [{ label: 'Submit new dates', href: '/time-off' }] },
  { id: 'i10', type: 'time-off-request', fromId: 'E-0021', title: 'Mira Hassan submitted PTO', preview: 'May 26 - May 30. Wedding.', body: 'Mira is requesting 5 working days off (May 26 – May 30) for a wedding. Coverage plan included in the request: Paige Nelson will cover frontend reviews.', day: 'Apr 18, 2026', time: '14:18', unread: false, actionable: [{ label: 'Review request', href: '/time-off' }] },
  { id: 'i11', type: 'review-due', title: 'Manager reviews open in 5 days', preview: 'Cycle Q2 2026 manager review window opens June 1.', body: 'Reminder: you have 3 direct reports needing manager reviews this cycle. Window opens June 1, closes June 15.', day: 'Apr 16, 2026', time: '09:00', unread: false, actionable: [{ label: 'Go to reviews', href: '/reviews' }] },
  { id: 'i12', type: 'doc-signed', title: 'Q1 2026 review finalized', preview: 'Rating + manager notes uploaded.', body: 'Your Q1 2026 review is finalized. Rating: Strongly meets. Manager headline: "Shipped DS v3 milestone two weeks early. Mentoring 3 ICs."', day: 'Apr 12, 2026', time: '11:00', unread: false, starred: true, actionable: [{ label: 'Open review', href: '/reviews' }] },
]
