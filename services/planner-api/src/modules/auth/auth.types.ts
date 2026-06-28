export type ApiUser = {
  id: string;
  email: string;
  motivator_role: string;
  plan_tier: string;
  vault_encryption_enabled: boolean;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresInSec: number;
};

export type AuthPublicUser = {
  id: string;
  email: string;
  motivator_role: string;
  plan_tier: string;
  vault_encryption_enabled: boolean;
};

export function toPublicUser(row: ApiUser): AuthPublicUser {
  return {
    id: row.id,
    email: row.email,
    motivator_role: row.motivator_role,
    plan_tier: row.plan_tier,
    vault_encryption_enabled: row.vault_encryption_enabled,
  };
}
