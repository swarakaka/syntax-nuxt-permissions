// composables/useRoles.ts
import { ref, watch } from 'vue'
import type { Permissions, Roles, UserInterface } from '../types'
import { useSanctumUser } from '#imports'

export function useRoles() {
  const user = useSanctumUser<UserInterface>()
  const roles = ref<Roles>([])

  // Watch for changes in the auth user and update roles
  watch(() => user.value, (newUser) => {
    if (newUser?.roles) {
      roles.value = newUser.roles
    }
    else {
      roles.value = []
    }
  }, { immediate: true })

  return {
    roles,
    hasRole: (role: string | string[]) => {
      const checkRoles = Array.isArray(role) ? role : [role]
      return checkRoles.some(r => roles.value.includes(r))
    },
    clearRoles: () => {
      roles.value = []
    },
  }
}

// composables/usePermissions.ts

export function usePermissions() {
  const user = useSanctumUser()
  const permissions = ref<Permissions>({})

  // Watch for changes in the auth user and update permissions
  watch(() => user.value, (newUser) => {
    if (newUser?.permissions) {
      permissions.value = newUser.permissions
    }
    else {
      permissions.value = {}
    }
  }, { immediate: true })

  return {
    permissions,
    hasPermission: (permission: string | string[]) => {
      const checkPermissions = Array.isArray(permission) ? permission : [permission]
      return checkPermissions.some(p => permissions.value[p] === true)
    },
    clearPermissions: () => {
      permissions.value = {}
    },
  }
}
