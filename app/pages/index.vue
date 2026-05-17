<script setup lang="ts">
import type { Deck } from '~/types';

const isCreateModalOpen = ref(false);

const { data: decks } = await useAsyncData<Deck[]>('decks', async () => {
  return [
    { id: 1, name: 'Tiếng Anh cơ bản', description: 'Từ vựng tiếng Anh cho người mới bắt đầu', cardCount: 120, lastStudied: '2025-01-10T08:00:00Z', progress: 65 },
    { id: 2, name: 'Ngữ pháp Nhật', description: 'Các mẫu câu ngữ pháp tiếng Nhật N5-N4', cardCount: 80, lastStudied: '2025-01-09T14:30:00Z', progress: 40 },
    { id: 3, name: 'Lịch sử Việt Nam', description: 'Các sự kiện lịch sử quan trọng', cardCount: 50, lastStudied: null, progress: 0 },
    { id: 4, name: 'Toán cao cấp', description: 'Công thức và định lý toán học', cardCount: 95, lastStudied: '2025-01-08T10:00:00Z', progress: 20 },
  ];
}, { default: () => [] });

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
                :value="deck.progress"
                size="sm"
                :color="deck.progress > 0 ? 'primary' : 'neutral'"
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
