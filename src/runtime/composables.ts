// composables/useRoles.ts
import { useStorage } from '@vueuse/core'
import type { Permissions, Roles } from '../types'

export function useRoles() {
  const roles = useStorage<Roles>('roles', [])

  return {
    roles,
    hasRole: (role: string | string[]) => {
      const checkRoles = Array.isArray(role) ? role : [role]
      return checkRoles.some(r => roles.value.includes(r))
    },
    addRole: (role: string) => {
      if (!roles.value.includes(role)) {
        roles.value.push(role)
      }
    },
    removeRole: (role: string) => {
      roles.value = roles.value.filter(r => r !== role)
    },
    clearRoles: () => {
      roles.value = []
    },
  }
}

// composables/usePermissions.ts

export function usePermissions() {
  const permissions = useStorage<Permissions>('permissions', {})

  return {
    permissions,
    hasPermission: (permission: string | string[]) => {
      const checkPermissions = Array.isArray(permission) ? permission : [permission]
      return checkPermissions.some(p => permissions.value[p] === true)
    },
    setPermissions: (newPermissions: Record<string, boolean>) => {
      permissions.value = newPermissions
    },
    addPermission: (permission: string) => {
      permissions.value[permission] = true
    },
    removePermission: (permission: string) => {
      permissions.value[permission] = false
    },
    clearPermissions: () => {
      permissions.value = {}
    },
  }
}
