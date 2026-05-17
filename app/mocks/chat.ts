/**
 * Chat threads. Two-pane DM model: left rail of people I talk to,
 * right pane is the active conversation.
 *
 * "Me" = E-0002 (Marcus Rivera) for consistency with the rest of the
 * demo. Messages span DMs with manager, peers, and direct reports
 * across a few days so the thread list feels organic.
 */

import { EMPLOYEES, findEmployee } from './people'

export const ME_ID = 'E-0002'

export interface ChatMessage {
  id: string
  fromId: string
  text: string
  at: string // ISO-ish; rendered as time
}

export interface ChatThread {
  partnerId: string
  unread: number
  lastTs: string
  presence: 'online' | 'away' | 'offline'
  messages: ChatMessage[]
}

export const THREADS: ChatThread[] = [
  {
    partnerId: 'E-0004', unread: 2, lastTs: '14:22', presence: 'online',
    messages: [
      { id: 'm1', fromId: 'E-0004', text: 'Hey Marcus — got a sec to look at the v3 token decision?', at: 'Today 13:50' },
      { id: 'm2', fromId: 'E-0002', text: 'Sure, what\'s the question?', at: 'Today 13:52' },
      { id: 'm3', fromId: 'E-0004', text: 'Laura wants to land the OKLCH lightness band by EOW so Berlin can pick it up. Are we good with the current values?', at: 'Today 13:55' },
      { id: 'm4', fromId: 'E-0004', text: 'I\'m leaning toward approving — chart-1 needs a slight nudge but otherwise looks solid.', at: 'Today 14:22' },
    ],
  },
  {
    partnerId: 'E-0007', unread: 1, lastTs: '11:47', presence: 'online',
    messages: [
      { id: 'm5', fromId: 'E-0007', text: 'Tagged you in #design-systems on the v3 spec.', at: 'Yesterday 12:00' },
      { id: 'm6', fromId: 'E-0002', text: 'Saw it, replying now.', at: 'Yesterday 13:10' },
      { id: 'm7', fromId: 'E-0007', text: 'Thanks! Also — any chance you can review Kyle\'s onboarding redesign? He\'s blocked on a frontend sanity check.', at: 'Today 11:47' },
    ],
  },
  {
    partnerId: 'E-0006', unread: 0, lastTs: '09:15', presence: 'online',
    messages: [
      { id: 'm8', fromId: 'E-0006', text: 'Peer review request inbound — apologies for the late ask.', at: 'Today 09:15' },
      { id: 'm9', fromId: 'E-0002', text: 'No worries, I\'ll get to it before Friday.', at: 'Today 09:18' },
    ],
  },
  {
    partnerId: 'E-0021', unread: 0, lastTs: 'Yesterday', presence: 'away',
    messages: [
      { id: 'm10', fromId: 'E-0021', text: 'Submitted my PTO for the wedding week 🎉', at: 'Yesterday 14:18' },
      { id: 'm11', fromId: 'E-0002', text: 'Saw it — approved. Have a great time.', at: 'Yesterday 14:32' },
      { id: 'm12', fromId: 'E-0021', text: 'Thanks Marcus! Coverage doc is in the request.', at: 'Yesterday 14:35' },
    ],
  },
  {
    partnerId: 'E-0026', unread: 0, lastTs: 'Mon', presence: 'offline',
    messages: [
      { id: 'm13', fromId: 'E-0026', text: 'Quick sync tomorrow? Want to walk through the mobile shell design.', at: 'Mon 10:00' },
      { id: 'm14', fromId: 'E-0002', text: 'Yes — let\'s do 2pm PT.', at: 'Mon 10:05' },
    ],
  },
  {
    partnerId: 'E-0009', unread: 0, lastTs: 'May 12', presence: 'offline',
    messages: [
      { id: 'm15', fromId: 'E-0009', text: 'Pushed the ledger service refactor. Tests green.', at: 'May 12 16:40' },
      { id: 'm16', fromId: 'E-0002', text: 'Reviewing now.', at: 'May 12 16:55' },
    ],
  },
]

export function partner(t: ChatThread) {
  return findEmployee(t.partnerId)
}
