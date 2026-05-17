/**
 * Route-level guard: manager-or-above. Admins pass through.
 *
 * Client-only -- same reasoning as require-admin: persona state lives
 * in localStorage. SSR has no read access; the redirect fires after
 * hydration.
 */
export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) return
  const { isManager } = usePersona()
  if (!isManager.value) {
    return navigateTo('/403')
  }
})
