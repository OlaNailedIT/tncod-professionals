import "server-only";

import { AppError } from "@/lib/errors";
import { getPrisma } from "@/lib/prisma/client";
import { hasPermission } from "@/security/authorization";
import type { AppRoleName, PermissionKey } from "@/security/permissions";

export async function loadPermissionKeys(userId: string): Promise<readonly PermissionKey[]> {
  const prisma = getPrisma();
  const rows = await prisma.userRole.findMany({
    where: { userId },
    include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
  });
  const keys = new Set<PermissionKey>();
  for (const ur of rows) {
    for (const rp of ur.role.rolePermissions) {
      keys.add(rp.permission.key as PermissionKey);
    }
  }
  return [...keys];
}

export async function loadRoleNames(userId: string): Promise<readonly AppRoleName[]> {
  const prisma = getPrisma();
  const rows = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true },
  });
  return rows.map((r) => r.role.name as AppRoleName);
}

export async function requirePermission(userId: string, permission: PermissionKey): Promise<void> {
  const granted = await loadPermissionKeys(userId);
  if (!hasPermission(granted, permission)) {
    throw new AppError("UNAUTHORIZED", "Permission denied");
  }
}

export async function requireRole(userId: string, role: AppRoleName): Promise<void> {
  const roles = await loadRoleNames(userId);
  if (!roles.includes(role)) {
    throw new AppError("UNAUTHORIZED", "Role denied");
  }
}

export function assertOwnership(ownerUserId: string, actorUserId: string): void {
  if (ownerUserId !== actorUserId) {
    throw new AppError("UNAUTHORIZED", "Ownership denied");
  }
}
