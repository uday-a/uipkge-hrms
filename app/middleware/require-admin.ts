/**
 * Route-level guard: only admin persona may proceed. Redirects to /403
 * for lower-tier personas. Used on /people/new, /settings/persona,
 * /settings/api-keys, etc.
 *
 * Client-only: persona lives in localStorage so the SSR pass can't read
 * it. We skip the check server-side and let the client redirect after
 * hydration. Pages are still prerendered as if accessible; the redirect
 * happens in the browser before any sensitive UI is interactive.
 */
export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) return
  const { isAdmin } = usePersona()
  if (!isAdmin.value) {
    return navigateTo('/403')
  }
})
