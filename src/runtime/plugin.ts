import { computed, watch } from 'vue'
import type { ModuleOptions } from '../types'
import { useLogger } from './utils/logger'
import { useRoles, usePermissions } from './composables'
import { defineNuxtPlugin, addRouteMiddleware, useRuntimeConfig } from '#app'

export default defineNuxtPlugin((_nuxtApp) => {
  const config = useRuntimeConfig().public.nuxtPermissions as ModuleOptions
  const logger = useLogger()
  const { roles } = useRoles()
  const { permissions } = usePermissions()

  const cachedPermissions = computed(() => permissions.value)
  const cachedRoles = computed(() => roles.value)

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
            if (node instanceof Element) {
              checkElementPermissionsAndRoles(node)
            }
          })
        }
        else if (mutation.type === 'attributes') {
          checkElementPermissionsAndRoles(mutation.target as Element)
        }
      })
    })

    mutationObserver.observe(document.body, observerOptions)

    return mutationObserver
  }

  const removedElements = new Map<string, Element>()
  const checkElementPermissionsAndRoles = (element: Element) => {
    const elementId = element.getAttribute('id') || crypto.randomUUID()

    const rolesAttribute = element.getAttribute('data-roles')
    if (rolesAttribute) {
      const requiredRoles = rolesAttribute.split(',').map(role => role.trim())
      if (!hasRole(requiredRoles)) {
        // خەزنکردنی نوسخەی عونسرەکە پێش سڕینەوەی
        if (!removedElements.has(elementId)) {
          removedElements.set(elementId, element.cloneNode(true) as Element)
        }
        element.remove()
        return
      }
    }

    // پشکنینی ڕێگەپێدانەکان
    const permissionsAttribute = element.getAttribute('data-permissions')
    if (permissionsAttribute) {
      const requiredPermissions = permissionsAttribute.split(',').map(perm => perm.trim())
      if (!hasPermission(requiredPermissions)) {
        // خەزنکردنی نوسخەی عونسرەکە پێش سڕینەوەی
        if (!removedElements.has(elementId)) {
          removedElements.set(elementId, element.cloneNode(true) as Element)
        }
        element.remove()
        return
      }
    }

    // پشکنینی منداڵەکان
    element.querySelectorAll('[data-roles],[data-permissions]').forEach((childElement) => {
      checkElementPermissionsAndRoles(childElement)
    })
  }

  watch([permissions, roles], () => {
    // گەڕانەوەی عەناسرە سڕاوەکان و پشکنینیان
    removedElements.forEach((element) => {
      const clonedElement = element.cloneNode(true) as Element
      document.body.appendChild(clonedElement)
      checkElementPermissionsAndRoles(clonedElement)
    })

    // پشکنینی عەناسرە هەنووکەییەکان
    const currentElements: NodeListOf<Element> = document.querySelectorAll('[data-roles],[data-permissions]')
    currentElements.forEach((element) => {
      checkElementPermissionsAndRoles(element)
    })
  }, { deep: true })

  // میتۆدی پشکنینی ڕۆڵ و ڕێگەپێدانەکان
  function hasRole(requiredRoles: string | string[]) {
    // پشکنین بۆ ڕۆڵە سەرەکییەکان
    const fullAccessRoles = typeof config.fullAccessRoles === 'string'
      ? [config.fullAccessRoles]
      : config.fullAccessRoles

    // بدایت یان ڕۆڵی سەرەکی هەبوو
    if (
      fullAccessRoles
      && fullAccessRoles.some(role => cachedRoles.value.includes(role))
    ) {
      return true
    }

    // پشکنینی ڕۆڵەکان
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

      // پشکنین بۆ redirectIfNotAllowed
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

  // دروستکردنی MutationObserver
  let permissionRoleObserver: MutationObserver

  _nuxtApp.hook('app:beforeMount', () => {
    permissionRoleObserver = createPermissionRoleObserver()
  })
  // پاک کردنەوەی observer لە کاتی داخستنی بەرنامە
  _nuxtApp.hook('app:error', () => {
    permissionRoleObserver.disconnect()
  })

  return {
    provide: {
      hasRole,
      hasPermission,
    },
  }
})
