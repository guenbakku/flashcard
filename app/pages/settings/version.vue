<script setup lang="ts">
const {
  hasUpdate,
  pending,
  currentVersion,
  latestVersion,
  update,
} = useUpdateChecking();

function handleUpdate() {
  isUpdating.value = true;
  // Delay reloading to allow the user to notice the loading state/UI change
  setTimeout(update, 1000);
};

const isUpdating = ref(false);
</script>

<template>
  <div class="grid gap-5">
    <UCard class="bg-elevated/50">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-info" class="text-primary size-5" />
          <p class="font-semibold text-highlighted">
            Phiên bản hiện tại
          </p>
        </div>
      </template>
      <div class="space-y-3">
        <ul class="text-sm text-muted pl-5 list-disc">
          <li>Version: {{ currentVersion.version }}</li>
          <li>Build Id: {{ currentVersion.buildId }}</li>
          <li>Date: {{ new Date(currentVersion.timestamp).toLocaleString() }}</li>
        </ul>

        <div class="space-y-2">
          <USeparator />
          <div v-if="pending" class="flex items-center space-x-1">
            <UIcon name="i-lucide-loader-circle" class="animate-spin text-primary size-5" />
            <p class="text-sm text-muted">
              Đang kiểm tra...
            </p>
          </div>
          <div v-else-if="hasUpdate" class="space-y-2">
            <p class="text-sm text-muted">
              Có bản cập nhật mới. Vui lòng nâng cấp để sử dụng các tính năng và dữ liệu mới nhất.<br>
              Phiên bản mới: {{ latestVersion?.version }}
            </p>
            <UButton
              color="primary"
              icon="i-lucide-refresh-cw"
              :loading="isUpdating"
              @click="handleUpdate"
            >
              Cập nhật ngay
            </UButton>
          </div>
          <UBadge v-else class="flex-1 items-center" variant="subtle">
            <UIcon name="i-lucide-check" class="text-primary size-5" />
            <p class="text-sm">
              Đang sử dụng phiên bản mới nhất
            </p>
          </UBadge>
        </div>
      </div>
    </UCard>
  </div>
</template>
