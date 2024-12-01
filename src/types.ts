export type Roles = string[]

export type Permissions = Record<string, boolean>

export interface ModuleOptions {
  redirectIfNotAllowed?: string | null
  fullAccessRoles?: string | string[] | null
  logPermissionChecks?: boolean
  strictMode?: boolean
}
