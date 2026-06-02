<script setup lang="ts">
const colorMode = useColorMode();
</script>

<template>
  <div class="grid gap-5">
    <UCard class="bg-elevated/50">
      <div class="flex justify-between">
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-sun" class="text-primary size-5" />
          <div>
            <p class="font-semibold text-highlighted">Giao diện</p>
            <p class="text-sm text-muted">Chọn chế độ sáng hoặc tối cho ứng dụng.</p>
          </div>
        </div>
        <div class="flex items-center min-w-10">
          <ClientOnly>
            <UColorModeButton
              :label="colorMode.value === 'dark' ? 'Tối' : 'Sáng'"
              variant="solid"
            />
          </ClientOnly>
        </div>
      </div>
    </UCard>
  </div>
</template>
