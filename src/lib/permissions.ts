import { ROLES } from "./constants";

export type UserPermissions = {
  permissions: string[];
  roleName: string;
};

/**
 * Check if a user has a specific permission.
 * Supports wildcard matching: "products.*" matches "products.read", "products.edit", etc.
 */
export function checkPermission(
  user: UserPermissions | null | undefined,
  permission: string
): boolean {
  if (!user || !user.permissions) return false;

  return user.permissions.some((p: string) => {
    if (p === permission) return true;
    // Wildcard: "products.*" matches "products.read"
    if (p.endsWith(".*")) {
      const prefix = p.slice(0, -1);
      return permission.startsWith(prefix);
    }
    // Super wildcard: "platform.*" grants everything
    if (p === "platform.*") return true;
    return false;
  });
}

export function isPlatformAdmin(user: UserPermissions | null | undefined): boolean {
  if (!user) return false;
  return user.roleName === ROLES.PLATFORM_ADMIN;
}

export function isCompanyAdmin(user: UserPermissions | null | undefined): boolean {
  if (!user) return false;
  return (
    user.roleName === ROLES.COMPANY_ADMIN ||
    user.roleName === ROLES.PLATFORM_ADMIN
  );
}
