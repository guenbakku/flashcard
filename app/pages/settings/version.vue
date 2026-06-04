<script setup lang="ts">
const config = useRuntimeConfig();
const { data: latestVersion } = useClientFetch<{ buildId: string; timestamp: number }>(
  '/version.json',
);

const hasUpdate = computed(
  () => latestVersion.value?.buildId && latestVersion.value.buildId !== config.app.buildId,
);

const reloadApp = () => {
  window.location.reload();
};
</script>

<template>
  <div class="grid gap-5">
    <UCard class="bg-elevated/50">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-info" class="text-primary size-5" />
          <p class="font-semibold text-highlighted">
            Phiên bản ứng dụng
          </p>
        </div>
      </template>
      <div class="space-y-3">
        <ul class="text-sm text-muted">
          <li>
            Version: {{ config.public.version }}
          </li>
          <li>
            Build Id: {{ config.app.buildId }}
          </li>
        </ul>

        <div v-if="hasUpdate" class="space-y-2">
          <USeparator />
          <p class="text-sm text-muted">
            Đã có bản cập nhật mới. Vui lòng nâng cấp để sử dụng các tính năng và dữ liệu mới nhất.
          </p>
          <UButton color="primary" @click="reloadApp">
            Cập nhật ngay
          </UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>
