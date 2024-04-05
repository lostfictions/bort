/**
 * Escape special characters that would cause errors if we interpolated them
 * into a regex.
 * @param expression The string to escape.
 * @returns The escaped string, usable in a regular expression constructor.
 */
export function escapeForRegex(expression: string): string {
  return expression.replaceAll(/[\\^$*+?.()|[\]{}]/g, "\\$&");
}

/** Returns a random number between min (inclusive) and max (exclusive). */
export function randomInt(max: number): number;
export function randomInt(min: number, max?: number): number {
  /* eslint-disable no-param-reassign */
  if (max == null) {
    max = min;
    min = 0;
  }
  if (max < min) {
    [min, max] = [max, min];
  }
  /* eslint-enable no-param-reassign */
  return Math.floor(Math.random() * (max - min)) + min;
}

export function randomInArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// TODO: handle empty objects, zero weights
export function randomByWeight(weights: { [value: string]: number }): string {
  const keys = Object.keys(weights);
  const sum = Object.values(weights).reduce((p, c) => {
    if (c < 0) throw new Error("Negative weight!");
    return p + c;
  }, 0);
  if (sum === 0) throw new Error("Weights add up to zero!");
  const choose = Math.floor(Math.random() * sum);
  for (let i = 0, count = 0; i < keys.length; i++) {
    count += weights[keys[i]];
    if (count > choose) {
      return keys[i];
    }
  }
  throw new Error("We goofed!");
}
