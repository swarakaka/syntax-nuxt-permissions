import { defineNuxtModule, addImports, addPlugin, createResolver } from '@nuxt/kit'

import type { ModuleOptions } from './types'

const defaults: ModuleOptions = {
  redirectIfNotAllowed: '/',
  fullAccessRoles: null,
  logPermissionChecks: false,
  strictMode: false,
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'syntax-nuxt-permissions',
    configKey: 'permissions',
    compatibility: {
      nuxt: '^3.0.0',
    },
  },
  // Default configuration options of the Nuxt module
  defaults,
  setup(_options, _nuxt) {
    const validatedOptions = validateOptions(_options)
    _nuxt.options.runtimeConfig.public.permissions = validatedOptions
    const resolver = createResolver(import.meta.url)

    // Do not add the extension since the `.ts` will be transpiled to `.mjs` after `npm run prepack`
    addPlugin(resolver.resolve('./runtime/plugin'))

    addImports([
      {
        name: 'useRoles',
        as: 'useRoles',
        from: resolver.resolve('runtime/composables'),
      },
      {
        name: 'usePermissions',
        as: 'usePermissions',
        from: resolver.resolve('runtime/composables'),
      },
      // زیاد کردنی composable ی نوێ
      {
        name: 'usePermissionLogger',
        as: 'usePermissionLogger',
        from: resolver.resolve('runtime/composables'),
      },
    ])

    _nuxt.hook('app:resolve', () => {
      if (validatedOptions.logPermissionChecks) {
        console.log('Nuxt Permissions module loaded with options:', validatedOptions)
      }
    })
  },
})

function validateOptions(options: ModuleOptions): ModuleOptions {
  const validatedOptions = { ...defaults, ...options }

  // زیاد کردنی هەندێک پشکنین
  if (validatedOptions.fullAccessRoles
    && !Array.isArray(validatedOptions.fullAccessRoles)) {
    validatedOptions.fullAccessRoles
      = [validatedOptions.fullAccessRoles as string]
  }

  // دڵنیا بوون لە جۆری ڕووت
  if (typeof validatedOptions.redirectIfNotAllowed !== 'string') {
    validatedOptions.redirectIfNotAllowed = '/'
  }

  return validatedOptions
}
