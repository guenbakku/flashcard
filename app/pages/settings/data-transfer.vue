<script setup lang="ts">
const toast = useToast();
const fileInput = useTemplateRef<{ inputRef: HTMLInputElement }>('fileInputRef');

const { emptyDb, getDb } = useIndexedDb();

const importError = ref('');
const fileValue = ref(null);
const isExporting = ref(false);
const isImporting = ref(false);

const canUpload = computed(() => !!fileValue.value);

watch(fileValue, () => {
  importError.value = '';
});

async function handleExport() {
  try {
    isExporting.value = true;
    const db = await getDb();

    // Dump entire database to JSON
    const jsonData = await db.exportJSON();
    const localDatetime = new Date().toLocaleString('sv').slice(0, 19).replace(/[^0-9]/g, '');

    // Create blob and download
    const json = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flashcard-backup-${localDatetime}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.add({
      title: 'Đã xuất dữ liệu thành công',
      color: 'success',
      icon: 'i-lucide-check-circle',
    });
  } catch (error) {
    console.error('Export failed:', error);
    toast.add({
      title: 'Xuất dữ liệu thất bại',
      description: error instanceof Error ? error.message : 'Lỗi không xác định',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
  } finally {
    isExporting.value = false;
  }
}

async function handleImport() {
  const file = fileInput.value?.inputRef?.files?.[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      isImporting.value = true;
      const fileContent = e.target?.result as string;
      const parsed = JSON.parse(fileContent);

      // Validate basic structure
      if (!parsed || typeof parsed !== 'object') {
        importError.value = 'File không hợp lệ. Vui lòng chọn file JSON đúng định dạng.';
        return;
      }

      // Clear existing data before importing
      const db = await getDb();
      await emptyDb();

      // Import JSON data - this will replace all existing data
      await db.importJSON(parsed);

      importError.value = '';
      fileValue.value = null;
      toast.add({
        title: 'Đã khôi phục dữ liệu thành công',
        description: 'Dữ liệu hiện tại đã được thay thế hoàn toàn bằng dữ liệu từ file',
        color: 'success',
        icon: 'i-lucide-check-circle',
      });
    } catch (error) {
      console.error(error);
      toast.add({
        title: 'Khôi phục dữ liệu thất bại',
        color: 'error',
        icon: 'i-lucide-alert-circle',
      });
    } finally {
      isImporting.value = false;
    }
  };

  reader.readAsText(file);
}
</script>

<template>
  <div class="grid gap-5">
    <!-- Export -->
    <UCard class="bg-elevated/50">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-download" class="text-primary size-5" />
          <p class="font-semibold text-highlighted">
            Sao lưu dữ liệu
          </p>
        </div>
      </template>
      <div class="space-y-3">
        <p class="text-sm text-muted">
          Tải xuống toàn bộ dữ liệu của bạn (bộ thẻ, thẻ, tiến độ học) dưới dạng file JSON.
        </p>
        <UButton
          icon="i-lucide-download"
          label="Tải xuống"
          :loading="isExporting"
          :disabled="isExporting"
          @click="handleExport"
        />
      </div>
    </UCard>

    <!-- Import -->
    <UCard class="bg-elevated/50">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-upload" class="text-primary size-5" />
          <p class="font-semibold text-highlighted">
            Khôi phục dữ liệu
          </p>
        </div>
      </template>

      <div class="space-y-3">
        <p class="text-sm text-muted">
          Nhập toàn bộ dữ liệu từ file JSON. Dữ liệu hiện tại sẽ được
          <strong class="text-warning">thay thế hoàn toàn</strong> bằng dữ liệu từ file.
        </p>
        <div class="flex flex-col items-start gap-4">
          <UInput
            ref="fileInputRef"
            v-model="fileValue"
            type="file"
          />
          <UButton
            icon="i-lucide-upload"
            label="Khôi phục"
            :disabled="!canUpload || isImporting"
            :loading="isImporting"
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
