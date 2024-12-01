import type { ModuleOptions } from '../types'
import { useLogger } from '../utils/logger'
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
  addRouteMiddleware('syntax-nuxt-permissions', (to) => {
    try {
      const routePermissions = to.meta?.permissions as string | string[] | undefined
      const routeRoles = to.meta?.roles as string | string[] | undefined

      if (!routePermissions && !routeRoles) return true

      const hasPermission = routePermissions ? hasRequiredPermissions(routePermissions) : true
      const hasRole = routeRoles ? hasRequiredRoles(routeRoles) : true

      if (hasPermission && hasRole) return true

      logger.warn('Access Denied', { route: to.path, requiredPermissions: routePermissions, requiredRoles: routeRoles })

      return config.redirectIfNotAllowed || '/'
    }
    catch (error) {
      logger.error('Middleware Error', error)
      return '/'
    }
  })
})
