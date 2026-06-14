<script setup lang="ts">
import { refDebounced } from '@vueuse/core';

const { data: decks, pending, error } = useMarketDecks();

const keyword = useState(() => '');
const debouncedKeyword = refDebounced(keyword, 300);
const filteredDecks = computed(() =>
  decks.value?.filter(d => (
    d.name.toLowerCase().includes(debouncedKeyword.value.toLowerCase())
    || d.description.toLowerCase().includes(debouncedKeyword.value.toLowerCase())
  )) ?? [],
);
</script>

<template>
  <UDashboardPanel id="market">
    <template #header>
      <UDashboardNavbar title="Thư viện">
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
      <div class="py-3">
        <ClientOnly>
          <UPageGrid v-if="pending" class="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <div v-for="i in 2" :key="i" class="border border-default bg-elevated rounded-lg p-4 space-y-3">
              <USkeleton class="h-5 w-3/4 rounded bg-default/70" />
              <USkeleton class="h-4 w-full rounded bg-default/70" />
              <USkeleton class="h-4 w-12 rounded bg-default/70" />
              <USkeleton class="h-7 w-24 rounded-lg bg-default/70 mt-2" />
            </div>
          </UPageGrid>

          <div v-else-if="error" class="flex justify-center">
            <UEmpty
              icon="i-lucide-server-crash"
              title="Có lỗi xảy ra khi kết nối với server"
              description="Hãy thử lại sau một lúc nữa."
            />
          </div>

          <div v-else-if="filteredDecks.length === 0" class="flex justify-center">
            <UEmpty
              icon="i-lucide-meh"
              title="Không tìm thấy bộ thẻ nào"
              description="Hãy thử lại với từ khóa khác."
            />
          </div>

          <UPageGrid v-else class="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <UPageCard
              v-for="deck in filteredDecks"
              :key="deck.id"
              :title="deck.name"
              variant="subtle"
            >
              <template #description>
                <div class="mt-auto space-y-2">
                  <p class="text-sm text-muted whitespace-pre-line line-clamp-3">
                    {{ deck.description }}
                  </p>
                  <div class="flex items-center justify-between text-sm">
                    <div class="flex items-center gap-2">
                      <UIcon name="i-lucide-layers" class="text-primary size-4" />
                      <span class="text-muted">{{ deck.cardCount }} thẻ</span>
                    </div>
                  </div>
                </div>
              </template>

              <template #footer>
                <div class="flex flex-wrap gap-2">
                  <UButton
                    :to="{ name: 'market-deckId', params: { deckId: deck.id } }"
                    size="sm"
                    variant="subtle"
                    icon="i-lucide-book-a"
                    class="flex-1"
                  >
                    Xem bộ thẻ
                  </UButton>
                </div>
              </template>
            </UPageCard>
          </UPageGrid>
        </ClientOnly>
      </div>
    </template>
  </UDashboardPanel>
</template>
