export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  VIEW_ADMIN: 'view_admin',
  TASKER: 'tasker',
}

export function isSuperAdmin(user) {
  return user?.role === ROLES.SUPER_ADMIN
}

export function isAdmin(user) {
  return user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.VIEW_ADMIN
}

export function isViewAdmin(user) {
  return user?.role === ROLES.VIEW_ADMIN
}

export function isTasker(user) {
  return user?.role === ROLES.TASKER
}

// Super admins (Vincent, Judy) also track time and appear in worker lists
export function canTrackTime(user) {
  return isTasker(user) || isSuperAdmin(user)
}

// Users who can be assigned milestones, accounts, and other work
export function isAssignable(user) {
  return isTasker(user) || isSuperAdmin(user)
}

export function canEdit(user) {
  return isSuperAdmin(user)
}

export function canViewAdmin(user) {
  return isAdmin(user)
}
