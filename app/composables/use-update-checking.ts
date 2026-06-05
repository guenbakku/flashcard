type Version = {
  version: string;
  buildId: string;
  timestamp: number;
};

const CONTINUOS_CHECKING_INTERVAL_SEC = 1800; // 30 minutes
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

  const config = useRuntimeConfig();
  const currentVersion = shallowRef({
    version: config.public.version,
    timestamp: config.public.buildTimestamp,
    buildId: String(config.app.buildId),
  });

  onMounted(fetchData);

  const hasUpdate = computed(
    () => latestVersion.value?.version && latestVersion.value.version !== currentVersion.value.version,
  );

  const update = () => window.location.reload();

  const registerContinuousChecking = () => {
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
            onClick: update,
          },
        ],
      });
    };

    watch(
      latestVersion,
      () => shouldNotify() && notify(),
    );

    const intervalHandle = useIntervalFn(
      fetchData,
      CONTINUOS_CHECKING_INTERVAL_SEC * 1000,
      { immediate: false },
    );

    onMounted(() => {
      intervalHandle.resume();
    });

    onUnmounted(() => {
      intervalHandle.pause();
    });
  };

  return {
    hasUpdate,
    pending,
    latestVersion,
    currentVersion,
    update,
    registerContinuousChecking,
  };
};

export default useUpdateChecking;
