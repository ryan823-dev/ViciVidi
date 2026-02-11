import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      tenantId: string;
      tenantName: string;
      tenantSlug: string;
      roleId: string;
      roleName: string;
      permissions: string[];
    };
  }

  interface User {
    tenantId?: string;
    tenantName?: string;
    tenantSlug?: string;
    roleId?: string;
    roleName?: string;
    permissions?: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    tenantId?: string;
    tenantName?: string;
    tenantSlug?: string;
    roleId?: string;
    roleName?: string;
    permissions?: string[];
  }
}
