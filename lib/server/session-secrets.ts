/** Required session secrets — fail closed in production. */

const MIN_SECRET_LENGTH = 32;

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function assertStrongSecret(name: string, value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    if (isProduction()) {
      throw new Error(`${name} must be set in production`);
    }
    return `dev-only-${name}-change-me-before-production`;
  }
  if (isProduction() && trimmed.length < MIN_SECRET_LENGTH) {
    throw new Error(`${name} must be at least ${MIN_SECRET_LENGTH} characters in production`);
  }
  return trimmed;
}

export function getManagementSessionSecret(): string {
  return assertStrongSecret(
    "MANAGEMENT_SESSION_SECRET",
    process.env.MANAGEMENT_SESSION_SECRET,
  );
}

export function getGuestDeviceSecret(): string {
  const dedicated = process.env.GUEST_DEVICE_SECRET?.trim();
  if (dedicated) {
    if (isProduction() && dedicated.length < MIN_SECRET_LENGTH) {
      throw new Error(
        `GUEST_DEVICE_SECRET must be at least ${MIN_SECRET_LENGTH} characters in production`,
      );
    }
    return dedicated;
  }
  return getManagementSessionSecret();
}
