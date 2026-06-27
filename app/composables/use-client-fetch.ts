import type { UseFetchOptions } from '#app';

/**
 * Fetch data from API only on client-side
 */
function useClientFetch<T>(url: string | (() => string), options: UseFetchOptions<T> = {}) {
  let urlValue = toValue(url);

  // Add buildVersion as query parameter to JSON files to prevent caching issues of browser.
  // This ensure user always get the latest version of JSON files after each build.
  if (urlValue.endsWith('.json')) {
    const config = useRuntimeConfig();
    urlValue = `${urlValue}?${config.app.buildId}`;
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
