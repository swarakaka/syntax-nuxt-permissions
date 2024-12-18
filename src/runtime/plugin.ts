import { computed, watch } from 'vue'
import type { ModuleOptions } from '../types'
import { useLogger } from './utils/logger'
import { useRoles, usePermissions } from './composables'
import { defineNuxtPlugin, addRouteMiddleware, useRuntimeConfig } from '#app'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig().public.permissions as ModuleOptions
  const logger = useLogger()
  const { roles } = useRoles()
  const { permissions } = usePermissions()

  const cachedPermissions = computed(() => permissions.value)
  const cachedRoles = computed(() => roles.value)

  let permissionRoleObserver: MutationObserver | null = null

  nuxtApp.hook('app:mounted', () => {
    initializeObserver()
  })
  function initializeObserver() {
    const checkElementPermissionsAndRoles = (element: HTMLElement) => {
      const children = Array.from(element.querySelectorAll<HTMLElement>('[data-roles],[data-permissions]'))

      let shouldRemove = false

      const rolesAttribute = element.getAttribute('data-roles')
      if (rolesAttribute) {
        const requiredRoles = rolesAttribute.split(',').map(role => role.trim())
        if (!hasRole(requiredRoles)) {
          shouldRemove = true
        }
      }

      const permissionsAttribute = element.getAttribute('data-permissions')
      if (permissionsAttribute && !shouldRemove) {
        const requiredPermissions = permissionsAttribute.split(',').map(perm => perm.trim())
        if (!hasPermission(requiredPermissions)) {
          shouldRemove = true
        }
      }

      if (shouldRemove) {
        children.forEach(child => checkElementPermissionsAndRoles(child))
        element.remove()
        return
      }

      children.forEach(child => checkElementPermissionsAndRoles(child))
    }

    const createPermissionRoleObserver = () => {
      const observerOptions = {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-roles', 'data-permissions'],
      }

      const mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node instanceof HTMLElement) {
                checkElementPermissionsAndRoles(node)
              }
            })
          }
          else if (mutation.type === 'attributes') {
            const element = mutation.target
            if (element instanceof HTMLElement) {
              checkElementPermissionsAndRoles(element)
            }
          }
        })
      })

      mutationObserver.observe(document.body, observerOptions)
      return mutationObserver
    }

    // چاودێریکردنی گۆڕانکارییەکان - تەنها لە client-side
    watch([permissions, roles], () => {
      requestAnimationFrame(() => {
        const elements = document.querySelectorAll<HTMLElement>('[data-roles],[data-permissions]')
        elements.forEach((element) => {
          if (element.isConnected) {
            checkElementPermissionsAndRoles(element)
          }
        })
      })
    }, { deep: true })

    permissionRoleObserver = createPermissionRoleObserver()
  }

  // پاککردنەوەی observer
  if (import.meta.client) {
    nuxtApp.hook('app:error', () => {
      if (permissionRoleObserver) {
        permissionRoleObserver.disconnect()
      }
    })
  }

  function hasRole(requiredRoles: string | string[]) {
    const fullAccessRoles = typeof config.fullAccessRoles === 'string'
      ? [config.fullAccessRoles]
      : config.fullAccessRoles

    if (
      fullAccessRoles
      && fullAccessRoles.some(role => cachedRoles.value.includes(role))
    ) {
      return true
    }

    const roles = typeof requiredRoles === 'string' ? [requiredRoles] : requiredRoles
    return roles.some(role => cachedRoles.value.includes(role))
  }

  function hasPermission(requiredPermissions: string | string[]) {
    const permissions = typeof requiredPermissions === 'string'
      ? [requiredPermissions]
      : requiredPermissions

    return permissions.some(permission =>
      cachedPermissions.value[permission] === true,
    )
  }

  // میانگرەی ڕووت
  addRouteMiddleware('syntax-nuxt-permissions', (to, from) => {
    try {
      const routeRoles = to.meta?.roles as string | string[] | undefined
      const routePermissions = to.meta?.permissions as string | string[] | undefined

      if (!routeRoles && !routePermissions) return true

      const hasRequiredRoles = routeRoles ? hasRole(routeRoles) : true
      const hasRequiredPermissions = routePermissions ? hasPermission(routePermissions) : true

      if (hasRequiredRoles && hasRequiredPermissions) return true

      logger.warn('Access Denied', {
        route: to.path,
        requiredRoles: routeRoles,
        requiredPermissions: routePermissions,
      })

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

  return {
    provide: {
      hasRole,
      hasPermission,
    },
  }
})
