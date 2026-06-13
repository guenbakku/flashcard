type Version = {
  version: string;
  buildId: string;
  timestamp: number;
};

const NOTIFY_RETRY_DELAY_SEC = 21600; // 6 hours

const getPendingState = () => useState(() => true);
const getLatestVersionState = () => useState<Version | undefined>();

const fetchData = useDebounceFn(async () => {
  const pending = getPendingState();
  const latestVersion = getLatestVersionState();

  pending.value = true;
  latestVersion.value = await $fetch(`/version.json?${Date.now()}`);
  pending.value = false;
}, 1000);

const useUpdateChecking = () => {
  const pending = getPendingState();
  const latestVersion = getLatestVersionState();
  const lastNotifiedAt = useLocalStorage<number | undefined>('new-version-notified-at', undefined);

  const { $pwa } = useNuxtApp();

  const config = useRuntimeConfig();
  const currentVersion = shallowRef({
    version: config.public.version,
    timestamp: config.public.buildTimestamp,
    buildId: String(config.app.buildId),
  });

  tryOnMounted(fetchData);

  const hasUpdate = computed(
    () => $pwa?.needRefresh && latestVersion.value?.version && latestVersion.value.version !== currentVersion.value.version,
  );

  const update = async () => {
    await $pwa?.updateServiceWorker(true);
    window.location.reload();
  };

  const checkUpdate = async () => {
    const shouldNotify = () => {
      const excludeRouteNames = ['settings-version'];
      if (excludeRouteNames.includes(String(useRoute().name))) {
        return false;
      }

      if (!hasUpdate.value) {
        return false;
      }

      if (lastNotifiedAt.value && (Date.now() - lastNotifiedAt.value) <= NOTIFY_RETRY_DELAY_SEC * 1000) {
        return false;
      }

      return true;
    };

    const notify = () => {
      lastNotifiedAt.value = Date.now();

      const toast = useToast();
      toast.add({
        title: 'Có bản cập nhật mới của ứng dụng',
        description: 'Vui lòng nâng cấp để sử dụng các tính năng và dữ liệu mới nhất.',
        orientation: 'vertical',
        duration: 0,
        icon: 'i-lucide-cloud-download',
        actions: [
          {
            icon: 'i-lucide-refresh-cw',
            label: 'Cập nhật ngay',
            color: 'primary',
            to: { name: 'settings-version' },
          },
        ],
      });
    };

    await fetchData();

    if (shouldNotify()) {
      notify();
    }
  };

  return {
    hasUpdate,
    pending,
    latestVersion,
    currentVersion,
    update,
    checkUpdate,
  };
};

export default useUpdateChecking;
