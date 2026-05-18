<script setup lang="ts">

const isCreateModalOpen = ref(false);

const { data: decks } = useDecks();

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Chưa học';
  return new Date(dateStr).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' });
}
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Bộ thẻ">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            icon="i-lucide-plus"
            size="md"
            class="rounded-full"
            @click="isCreateModalOpen = true"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-4 sm:p-6">
        <UPageGrid class="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <UPageCard
            v-for="deck in decks"
            :key="deck.id"
            :title="deck.name"
            :description="deck.description"
            variant="subtle"
            class="hover:z-1"
          >
            <template #leading>
              <div class="bg-primary/10 ring-primary/25 flex size-10 items-center justify-center rounded-full ring ring-inset">
                <UIcon name="i-lucide-layers" class="text-primary size-5" />
              </div>
            </template>

            <div class="mt-3 space-y-2">
              <div class="flex items-center justify-between text-sm">
                <span class="text-muted">{{ deck.cardCount }} thẻ</span>
                <UBadge
                  :color="deck.progress > 0 ? 'success' : 'neutral'"
                  variant="subtle"
                  size="sm"
                >
                  {{ deck.progress }}%
                </UBadge>
              </div>

              <UProgress
                v-model="deck.progress"
                size="sm"
                color="primary"
              />

              <p class="text-muted text-xs">
                Học lần cuối: {{ formatDate(deck.lastStudied) }}
              </p>
            </div>

            <template #footer>
              <div class="flex gap-2">
                <UButton
                  :to="`/decks/${deck.id}`"
                  size="sm"
                  variant="subtle"
                  icon="i-lucide-play"
                  class="flex-1"
                >
                  Học ngay
                </UButton>
              </div>
            </template>
          </UPageCard>
        </UPageGrid>
      </div>
    </template>
  </UDashboardPanel>

  <UModal v-model:open="isCreateModalOpen" title="Tạo bộ thẻ mới">
    <template #body>
      <UForm :state="{}" class="space-y-4">
        <UFormField label="Tên bộ thẻ" required>
          <UInput placeholder="VD: Tiếng Anh cơ bản" class="w-full" />
        </UFormField>
        <UFormField label="Mô tả">
          <UTextarea placeholder="Mô tả ngắn về bộ thẻ..." class="w-full" />
        </UFormField>
      </UForm>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton color="neutral" variant="ghost" @click="isCreateModalOpen = false">
          Hủy
        </UButton>
        <UButton icon="i-lucide-plus">
          Tạo
        </UButton>
      </div>
    </template>
  </UModal>
</template>
