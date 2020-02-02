/**
 * Assertion/helper that statically checks that all possible types have been
 * handled for a given variable (for example, in a switch statement).
 */
export function exhaustiveCheck<T>(toCheck: never, failureValue: () => T): T {
  console.error("Unexpected value: ", toCheck);
  return failureValue();
}
