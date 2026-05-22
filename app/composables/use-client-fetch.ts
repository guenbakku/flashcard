import type { UseFetchOptions } from '#app';

/**
 * Fetch data from API only on client-side
 */
const useClientFetch = <T>(url: string | (() => string), options: UseFetchOptions<T> = {}) => {
  let urlValue = toValue(url);

  // Add buildVersion as query parameter to JSON files to prevent caching issues of browser.
  // This ensure user always get the latest version of JSON files after each build.
  if (urlValue.endsWith('.json')) {
    const { public: { buildVersion } } = useRuntimeConfig();
    urlValue = `${urlValue}?${buildVersion}`;
  }

  const result = useFetch(urlValue, {
    ...options,
    server: false, // Turn off server-side fetching
  });

  watch(result.error, (err) => {
    if (err) {
      console.error(`[useClientFetch] ${urlValue}:`, err);
    }
  });

  return result;
};

export default useClientFetch;
