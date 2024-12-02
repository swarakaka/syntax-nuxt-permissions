export type Roles = string[]

export type Permissions = Record<string, boolean>

export interface ModuleOptions {
  redirectIfNotAllowed: string
  fullAccessRoles: string | string[] | null
  logPermissionChecks: boolean
  strictMode: boolean
}

export interface UserInterface {
  id: string
  username: string
  email: string
  permissions: Record<string, boolean>
  roles: string[]
}
