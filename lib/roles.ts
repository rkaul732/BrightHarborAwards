export const SUPER_ADMIN_EMAIL = "rkaul@brightharbor.org";

export const isAdmin = (role: string) => role === "admin" || role === "super_admin";
export const isSuperAdmin = (role: string) => role === "super_admin";
