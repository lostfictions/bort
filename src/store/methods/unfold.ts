import { DB } from "../get-db";

const key = "unfold";

interface UnfoldConfig {
  enabled: boolean;
}

export async function setUnfoldEnabled(
  db: DB,
  enabled: boolean
): Promise<void> {
  const unfold = await db.get<UnfoldConfig>(key);
  unfold.enabled = enabled;
  return db.put<UnfoldConfig>(key, unfold);
}

export async function getUnfoldEnabled(db: DB): Promise<boolean> {
  const unfold = await db.get<UnfoldConfig>(key);
  return unfold.enabled;
}

export async function shouldInitializeUnfold(db: DB): Promise<boolean> {
  try {
    const unfold = await db.get<UnfoldConfig>(key);
    if (typeof unfold !== "object") {
      return true;
    }
  } catch (e) {
    if (e.notFound) return true;
  }
  return false;
}

export async function initializeUnfold(db: DB) {
  await db.put<UnfoldConfig>(key, { enabled: true });
}
