/**
 * Persona / permission state.
 *
 * Three personas frame what a real HR product asks the UI to do:
 *   - admin    -- sees everything (default in demo)
 *   - manager  -- direct reports only, approvals queue active, payroll
 *                 viewable not editable, analytics scoped to their team
 *   - employee -- own profile, own time-off, own goals, own payslips,
 *                 inbox / chat / assistant. No team data, no analytics.
 *
 * Persisted in localStorage on the client so a refresh doesn't bounce
 * us back to admin. Sentinel default on the server (no localStorage).
 *
 * In a real product these gates would come from the auth provider's
 * claims; here we keep them deliberately client-side so the template
 * stays mock-only.
 *
 * Implementation: useState gives us SSR-safe shared state. Client-side
 * sync to localStorage happens via a watcher inside the composable.
 * Skipped Pinia + @pinia/nuxt because the integration with Nuxt 4 +
 * cloudflare-pages tripped a "pinia._s undefined" SSR error and the
 * surface here doesn't need a full store -- one string + helpers is it.
 */
export type Persona = 'admin' | 'manager' | 'employee'

export const PERSONA_LABELS: Record<Persona, string> = {
  admin: 'Admin',
  manager: 'Manager',
  employee: 'Employee',
}

const STORAGE_KEY = 'uipkge-hrms:persona'

export function usePersona() {
  const current = useState<Persona>('persona', () => 'admin')

  if (import.meta.client) {
    // Hydrate from localStorage on first client mount.
    const stored = window.localStorage.getItem(STORAGE_KEY) as Persona | null
    if (stored && ['admin', 'manager', 'employee'].includes(stored)) {
      current.value = stored
    }
    // Persist on change.
    watch(current, (v) => {
      try {
        window.localStorage.setItem(STORAGE_KEY, v)
      } catch {
        // Quota exceeded or private mode -- silently degrade.
      }
    })
  }

  const set = (p: Persona) => {
    current.value = p
  }

  const isAdmin = computed(() => current.value === 'admin')
  const isManager = computed(() => current.value === 'manager' || current.value === 'admin')

  return { current, set, isAdmin, isManager }
}
