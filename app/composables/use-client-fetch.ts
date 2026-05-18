import type { UseFetchOptions } from '#app';

/**
 * Fetch data from API only on client-side
 */
const useClientFetch = <T>(url: string | (() => string), options: UseFetchOptions<T> = {}) => {
  return useFetch(url, {
    ...options,
    server: false, // Turn off server-side fetching
  });
};

export default useClientFetch;
