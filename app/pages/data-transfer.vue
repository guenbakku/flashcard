<script setup lang="ts">
const toast = useToast();

const { exportProgress, importProgress } = useMyDecks();
const fileInput = useTemplateRef<{ inputRef: HTMLInputElement }>('fileInputRef');

const importError = ref('');
const fileValue = ref(null);

const canUpload = computed(() => !!fileValue.value);

watch(fileValue, () => {
  importError.value = '';
});

function handleExport() {
  const json = JSON.stringify(exportProgress(), null);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `flashcard-progress-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast.add({ title: 'Đã xuất dữ liệu thành công', color: 'success', icon: 'i-lucide-check-circle' });
}

function handleImport() {
  const file = fileInput.value?.inputRef?.files?.[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const parsed = JSON.parse(e.target?.result as string);
      if (typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error();
      }

      await importProgress(parsed.data);
      importError.value = '';
      toast.add({ title: 'Đã khôi phục dữ liệu thành công', color: 'success', icon: 'i-lucide-check-circle' });
    } catch {
      importError.value = 'File không hợp lệ. Vui lòng chọn file JSON đúng định dạng.';
    }
  };

  fileValue.value = null;
  reader.readAsText(file);
}
</script>

<template>
  <UDashboardPanel id="data-transfer">
    <template #header>
      <UDashboardNavbar title="Sao lưu dữ liệu">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-4 sm:p-6 max-w-xl space-y-6">
        <!-- Export -->
        <UCard>
          <div class="space-y-3">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-download" class="text-primary size-5" />
              <p class="font-semibold text-highlighted">
                Sao lưu dữ liệu
              </p>
            </div>
            <p class="text-sm text-muted">
              Tải xuống toàn bộ tiến độ học của bạn dưới dạng file JSON.
            </p>
            <UButton
              icon="i-lucide-download"
              label="Tải xuống"
              variant="subtle"
              @click="handleExport"
            />
          </div>
        </UCard>

        <!-- Import -->
        <UCard>
          <div class="space-y-3">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-upload" class="text-primary size-5" />
              <p class="font-semibold text-highlighted">
                Khôi phục dữ liệu
              </p>
            </div>
            <p class="text-sm text-muted">
              Nhập tiến độ từ file JSON. Dữ liệu sẽ được
              <span class="text-warning font-medium">gộp</span> vào tiến độ hiện tại.
            </p>
            <div class="flex flex-col items-start gap-2">
              <UInput
                ref="fileInputRef"
                v-model="fileValue"
                type="file"
              />
              <UButton
                icon="i-lucide-upload"
                label="Khôi phục"
                variant="subtle"
                :disabled="!canUpload"
                @click="handleImport"
              />
              <p v-if="importError" class="text-sm text-error">
                {{ importError }}
              </p>
            </div>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
