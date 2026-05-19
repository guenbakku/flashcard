import type { UseFetchOptions } from '#app';

/**
 * Fetch data from API only on client-side
 */
const useClientFetch = <T>(url: string | (() => string), options: UseFetchOptions<T> = {}) => {
  const result = useFetch(url, {
    ...options,
    server: false, // Turn off server-side fetching
  });

  watch(result.error, (err) => {
    if (err) {
      console.error(`[useClientFetch] ${url}:`, err);
    }
  });

  return result;
};

export default useClientFetch;
