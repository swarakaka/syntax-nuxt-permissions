import syntaxNuxtPermissions from '../../../src/module'

export default defineNuxtConfig({
  modules: [
    syntaxNuxtPermissions,
    'nuxt-auth-sanctum',
  ],
})
