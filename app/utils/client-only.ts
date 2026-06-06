/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Only execute the function on the client side. If it's called on the server side, it will return null.
 */
export function clientOnly<T extends (...args: any[]) => any>(fn: T) {
  return (...args: Parameters<T>): ReturnType<T> | undefined => {
    if (!import.meta.client) {
      return;
    }

    return fn(...args);
  };
}
