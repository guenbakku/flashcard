<script setup lang="ts">
import { refDebounced } from '@vueuse/core';
import { computed, ref } from 'vue';

const { data: decks, pending } = useMarketDecks();
const { decks: myDecks, copyMarketDeck } = useMyDecks();
const toast = useToast();
const copyingDeckIdentifier = ref<string | null>(null);

const keyword = useState(() => '');
const debouncedKeyword = refDebounced(keyword, 300);
const filteredDecks = computed(() =>
  decks.value?.filter(d => (
    d.name.toLowerCase().includes(debouncedKeyword.value.toLowerCase())
    || d.description.toLowerCase().includes(debouncedKeyword.value.toLowerCase())
  )) ?? [],
);

const copiedDecks = computed(() => new Set(myDecks.value.map(deck => deck.identifier)));

async function handleCopyDeck(identifier: string) {
  const deckMeta = decks.value?.find(d => d.identifier === identifier);
  if (!deckMeta) {
    return;
  }

  copyingDeckIdentifier.value = identifier;

  try {
    await copyMarketDeck(deckMeta);
    toast.add({ title: 'Đã sao chép bộ thẻ vào Bộ thẻ của tôi', color: 'success', icon: 'i-lucide-check-circle' });
  } catch {
    toast.add({ title: 'Sao chép bộ thẻ thất bại', color: 'error', icon: 'i-lucide-alert-circle' });
  } finally {
    copyingDeckIdentifier.value = null;
  }
}
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Bộ thẻ tham khảo">
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
        <ClientOnly>
          <UPageGrid v-if="pending" class="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <div v-for="i in 2" :key="i" class="border-default bg-default/50 rounded-xl border p-4 space-y-3">
              <USkeleton class="h-5 w-3/4 rounded" />
              <USkeleton class="h-4 w-full rounded" />
              <USkeleton class="h-4 w-2/3 rounded" />
              <div class="pt-2 space-y-2">
                <div class="flex justify-between">
                  <USkeleton class="h-4 w-16 rounded" />
                  <USkeleton class="h-4 w-10 rounded" />
                </div>
                <USkeleton class="h-2 w-full rounded" />
                <USkeleton class="h-3 w-32 rounded" />
              </div>
              <USkeleton class="h-8 w-full rounded-lg mt-2" />
            </div>
          </UPageGrid>

          <div v-else-if="filteredDecks.length === 0" class="flex flex-col items-center justify-center gap-4 py-16">
            <div class="bg-error/10 flex size-20 items-center justify-center rounded-full">
              <UIcon name="i-lucide-frown" class="text-error/80 size-10" />
            </div>
            <p>Không tìm thấy bộ thẻ nào</p>
          </div>

          <UPageGrid v-else class="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <UPageCard
              v-for="deck in filteredDecks"
              :key="deck.identifier"
              :title="deck.name"
              variant="subtle"
              class="hover:z-1"
            >
              <template #title>
                <p class="text-base text-pretty font-semibold text-highlighted line-clamp-2">
                  {{ deck.name }}
                </p>
              </template>
              <template #description>
                <div class="mt-auto space-y-2">
                  <p class="text-sm text-muted line-clamp-3">
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
                    v-if="copiedDecks.has(deck.identifier)"
                    :to="`/decks/${deck.identifier}`"
                    size="sm"
                    variant="subtle"
                    icon="i-lucide-book-open"
                    class="flex-1"
                  >
                    Xem bộ
                  </UButton>
                  <UButton
                    v-else
                    :disabled="copyingDeckIdentifier === deck.identifier"
                    size="sm"
                    color="primary"
                    class="flex-1"
                    @click="handleCopyDeck(deck.identifier)"
                  >
                    {{ copyingDeckIdentifier === deck.identifier ? 'Đang sao chép...' : 'Sao chép' }}
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
