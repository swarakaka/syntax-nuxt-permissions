import { computed } from 'vue'
import type { ModuleOptions } from '../types'
import { useLogger } from './utils/logger'
import { useRoles, usePermissions } from './composables'
import { defineNuxtPlugin, addRouteMiddleware, useRuntimeConfig } from '#app'

export default defineNuxtPlugin((_nuxtApp) => {
  const config = useRuntimeConfig().public.nuxtPermissions as ModuleOptions
  const logger = useLogger() // logging
  const { roles } = useRoles()
  const { permissions } = usePermissions()

  const cachedPermissions = computed(() => {
    return permissions.value
  })

  const cachedRoles = computed(() => {
    return roles.value
  })

  function hasRequiredPermissions(permissions: string | string[] | undefined) {
    if (!permissions) return false

    const routePermissions = typeof permissions === 'string'
      ? [permissions]
      : permissions

    return routePermissions.some((permission: string) =>
      cachedPermissions.value[permission] === true,
    )
  }

  function hasRequiredRoles(roles: string | string[] | undefined) {
    if (!roles) return false

    const fullAccessRoles = typeof config.fullAccessRoles === 'string'
      ? [config.fullAccessRoles]
      : config.fullAccessRoles

    const myRoles = typeof roles === 'string' ? [roles] : roles

    if (
      fullAccessRoles
      && fullAccessRoles.some(role => cachedRoles.value.includes(role))
    ) {
      return true
    }

    return myRoles.some(role => cachedRoles.value.includes(role))
  }

  // زیاتر کردنی هەڵەگرتن و بەڕێوەبردن
  addRouteMiddleware('syntax-nuxt-permissions', (to, from) => {
    try {
      const routePermissions = to.meta?.permissions as string | string[] | undefined
      const routeRoles = to.meta?.roles as string | string[] | undefined

      if (!routePermissions && !routeRoles) return true

      const hasPermission = routePermissions ? hasRequiredPermissions(routePermissions) : true
      const hasRole = routeRoles ? hasRequiredRoles(routeRoles) : true

      if (hasPermission && hasRole) return true

      logger.warn('Access Denied', { route: to.path, requiredPermissions: routePermissions, requiredRoles: routeRoles })

      if (!config.redirectIfNotAllowed) {
        if (from.fullPath !== to.fullPath) {
          return from.fullPath
        }
        return false
      }

      return config.redirectIfNotAllowed || '/'
    }
    catch (error) {
      logger.error('Middleware Error', error)
      return '/'
    }
  })

  function hasNotPermission(binding: string | string[] | undefined) {
    if (!binding) return true
    const activePermissions = typeof binding === 'string' ? [binding] : binding
    return !activePermissions.some(permission =>
      cachedPermissions.value[permission] === true,
    )
  }

  function hasPermission(binding: string | string[]) {
    if (!binding) return true
    return !hasNotPermission(binding)
  }

  _nuxtApp.vueApp.directive('can', {
    mounted(el, binding) {
      if (binding.arg === 'not') {
        if (hasPermission(binding.value)) {
          el.remove()
        }
        return
      }
      if (!hasPermission(binding.value)) {
        el.remove()
      }
    },
  })

  function hasNotRole(binding: string | string[] | undefined) {
    if (!binding) return true
    const activeRoles = typeof binding === 'string' ? [binding] : binding
    return !activeRoles.some(role => cachedRoles.value.includes(role))
  }

  function hasRole(binding: string | string[]) {
    if (!binding) return true
    const fullAccessRoles
      = typeof config.fullAccessRoles === 'string'
        ? [config.fullAccessRoles]
        : config.fullAccessRoles
    if (
      fullAccessRoles
      && fullAccessRoles.some(role => cachedRoles.value.includes(role))
    ) {
      return true
    }
    return !hasNotRole(binding)
  }

  _nuxtApp.vueApp.directive('role', {
    mounted(el, binding) {
      if (binding.arg === 'not') {
        if (hasRole(binding.value)) {
          el.remove()
        }
        return
      }
      if (!hasRole(binding.value)) {
        el.remove()
      }
    },
  })

  return {
    provide: {
      hasRole,
      hasPermission,
    },
  }
})
