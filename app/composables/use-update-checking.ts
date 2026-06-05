type Version = {
  version: string;
  buildId: string;
  timestamp: number;
};

const useUpdateChecking = () => {
  const pending = ref(true);
  const latestVersion = shallowRef<Version>();

  const config = useRuntimeConfig();
  const currentVersion = shallowRef({
    version: config.public.version,
    timestamp: config.public.buildTimestamp,
    buildId: String(config.app.buildId),
  });

  onMounted(async () => {
    latestVersion.value = await $fetch('/version.json');
    pending.value = false;
  });

  const hasUpdate = computed(
    () => latestVersion.value?.version && latestVersion.value.version !== currentVersion.value.version,
  );

  return {
    hasUpdate,
    pending,
    latestVersion,
    currentVersion,
  };
};

export default useUpdateChecking;
