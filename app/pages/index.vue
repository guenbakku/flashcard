<script setup lang="ts">
import { refDebounced } from '@vueuse/core';
const { data: decks } = useDecks();

const keyword = useState(() => '');
const debouncedKeyword = refDebounced(keyword, 300);
const filteredDecks = computed(() =>
  decks.value?.filter(d => (
    d.name.toLowerCase().includes(debouncedKeyword.value.toLowerCase())
    || d.description.toLowerCase().includes(debouncedKeyword.value.toLowerCase())
  ) ?? [],
));

function formatDate(dateStr: string | null): string {
  if (!dateStr) {
    return 'Chưa học';
  }

  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Bộ thẻ">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
      <UDashboardToolbar>
        <UInput
          v-model="keyword"
          icon="i-lucide-search"
          placeholder="Tìm bộ thẻ..."
          class="w-full sm:max-w-xs"
        >
          <template v-if="keyword" #trailing>
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              size="xs"
              @click="keyword = ''"
            />
          </template>
        </UInput>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="p-4 sm:p-6">
        <UPageGrid class="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <UPageCard
            v-for="deck in filteredDecks"
            :key="deck.identifier"
            :title="deck.name"
            :description="deck.description"
            variant="subtle"
            class="hover:z-1"
          >
            <div class="mt-3 space-y-2">
              <div class="flex items-center justify-between text-sm">
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-layers" class="text-primary size-4" />
                  <span class="text-muted">{{ deck.cardCount }} thẻ</span>
                </div>
                <UBadge
                  :color="deck.progress > 0 ? 'success' : 'neutral'"
                  variant="subtle"
                  size="sm"
                >
                  {{ deck.progress }}%
                </UBadge>
              </div>

              <UProgress
                :model-value="deck.progress"
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
                  :to="`/decks/${deck.identifier}`"
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
</template>
