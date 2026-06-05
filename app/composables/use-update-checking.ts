type Version = {
  version: string;
  buildId: string;
  timestamp: number;
};

const CONTINUOS_CHECKING_INTERVAL_SEC = 1800; // 30 minutes
const NOTIFY_RETRY_DELAY_SEC = 21600; // 6 hours

const useUpdateChecking = () => {
  const pending = ref(true);
  const latestVersion = useState<Version | undefined>();
  const isNotified = useLocalStorage<number | undefined>('new-version-notified-at', undefined);

  const config = useRuntimeConfig();
  const currentVersion = shallowRef({
    version: config.public.version,
    timestamp: config.public.buildTimestamp,
    buildId: String(config.app.buildId),
  });

  onMounted(() => fetchData());

  const fetchData = async () => {
    pending.value = true;
    latestVersion.value = await $fetch('/version.json');
    pending.value = false;
  };

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

      if (isNotified.value && (Date.now() - isNotified.value) <= NOTIFY_RETRY_DELAY_SEC * 1000) {
        return false;
      }

      return true;
    };

    const notify = () => {
      isNotified.value = Date.now();

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

    const watchHandle = watch(
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
      watchHandle.stop();
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
