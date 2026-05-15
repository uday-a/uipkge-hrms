import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  components: [
    // Allow `<AppTopbar />` etc. without the folder prefix. The Nuxt 4
    // default (`pathPrefix: true`) would have required `<NavAppTopbar />`,
    // which doesn't match the layout's component refs.
    //
    // `pattern: '**/*.vue'` restricts the scan to .vue files so per-dir
    // `index.ts` re-exports and `context.ts` helpers stop registering as
    // duplicate auto-imports (was causing "Two component files resolving
    // to the same name" warnings on Textarea / Timeline / Tooltip / Context).
    { path: '~/components', pathPrefix: false, pattern: '**/*.vue' },
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'uipkge HRMS — Vue 3 + Nuxt 4 reference template',
      meta: [
        { name: 'description', content: 'Reference HRMS template built end-to-end on the uipkge UI registry. Mock data, mock auth — copy any page as a starting point.' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { property: 'og:title', content: 'uipkge HRMS — reference template' },
        { property: 'og:type', content: 'website' },
      ],
    },
  },
})
