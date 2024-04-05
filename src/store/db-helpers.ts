import { DB } from "./get-db";

export async function getOrNull<T>(db: DB, key: string): Promise<T | null> {
  try {
    return await db.get<T>(key);
  } catch (e: any) {
    if (e.notFound) {
      return null;
    }
    throw e;
  }
}

export async function getWithDefault<T>(
  db: DB,
  key: string,
  defaultValue: T,
): Promise<T> {
  try {
    return await db.get<T>(key);
  } catch (e: any) {
    if (e.notFound) {
      return defaultValue;
    }
    throw e;
  }
}

const restrictedNameMatcher =
  /hasOwnProperty|valueOf|constructor|toLocaleString|isPrototypeOf|propertyIsEnumerable|toString/g;

export function isRestrictedObjectPropertyName(propName: string) {
  return restrictedNameMatcher.test(propName);
}
