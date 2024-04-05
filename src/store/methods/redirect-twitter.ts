import { DB } from "../get-db";

const key = "redirect-twitter";

interface RedirectTwitterConfig {
  enabled: boolean;
}

export async function setRedirectTwitterEnabled(
  db: DB,
  enabled: boolean,
): Promise<void> {
  const redirectTwitter = await db.get<RedirectTwitterConfig>(key);
  redirectTwitter.enabled = enabled;
  return db.put<RedirectTwitterConfig>(key, redirectTwitter);
}

export async function getRedirectTwitterEnabled(db: DB): Promise<boolean> {
  const redirectTwitter = await db.get<RedirectTwitterConfig>(key);
  return redirectTwitter.enabled;
}

export async function shouldInitializeRedirectTwitter(
  db: DB,
): Promise<boolean> {
  try {
    const redirectTwitter = await db.get<RedirectTwitterConfig>(key);
    if (typeof redirectTwitter !== "object") {
      return true;
    }
  } catch (e: any) {
    if (e.notFound) return true;
    throw e;
  }
  return false;
}

export async function initializeRedirectTwitter(db: DB) {
  await db.put<RedirectTwitterConfig>(key, { enabled: false });
}
