<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

import type { Card } from '~/types';

const route = useRoute();
const router = useRouter();
const identifier = String(route.params.identifier);

const toast = useToast();
const { getDeck: getMarketDeck } = useMarketDecks();
const { getDeckDetail, deleteDeck, copyMarketDeck, progress, updateProgress } = useMyDecks();

const marketDeck = computed(() => getMarketDeck(identifier));
const localDeck = ref<null | {
  identifier: string;
  name: string;
  description: string;
  cardCount: number;
  cards: Card[];
}>(null);
const isLoadingDeck = ref(true);
const isCopying = ref(false);

const deck = computed(() => {
  if (!localDeck.value) {
    return null;
  }

  const deckProgress = progress.value[identifier] ?? {
    lastStudied: null,
    masteredCards: {},
  };

  return {
    ...localDeck.value,
    lastStudied: deckProgress.lastStudied,
    masteredCards: deckProgress.masteredCards,
  };
});

const cards = computed(() => localDeck.value?.cards ?? []);
const capturedMasteredCards = ref<Record<string, boolean>>({});

const isShuffle = ref(false);
const isFilterCorrect = ref(false);
const isBrowseMode = ref(false);
const isFlipped = ref(false);

const browseIndex = ref(0);
const currentIndex = ref(0);
const results = ref<Record<string, boolean>>({});

const isLocalDeck = computed(() => !!localDeck.value);
const isMarketDeck = computed(() => !localDeck.value && !!marketDeck.value);

onMounted(async () => {
  if (import.meta.client) {
    localDeck.value = await getDeckDetail(identifier);
  }
  isLoadingDeck.value = false;
});

const displayCards = computed(() => {
  if (!cards.value) {
    return [];
  }

  const filtered = isFilterCorrect.value
    ? cards.value.filter(c => !capturedMasteredCards.value[c.front])
    : cards.value;

  if (!isShuffle.value) {
    return filtered;
  }

  return [...filtered].sort(() => Math.random() - 0.5);
});

const currentCard = computed(() => displayCards.value?.[currentIndex.value]);
const totalDeckCards = computed(() => cards.value.length);
const totalDisplayCards = computed(() => displayCards.value.length);
const progressPercent = computed(() => totalDisplayCards.value ? Math.round((Object.values(results.value).length / totalDisplayCards.value) * 100) : 0);

function answer(result: boolean) {
  if (!currentCard.value) {
    return;
  }

  results.value[currentCard.value.front] = result;

  if (result) {
    updateProgress({
      identifier,
      masteredCards: {
        ...deck.value?.masteredCards,
        [currentCard.value.front]: true,
      },
    });
  } else if (deck.value) {
    const masteredCards = (deck.value.masteredCards ?? {}) as Record<string, boolean>;
    const { [currentCard.value.front]: _discard, ...rest } = masteredCards;
    updateProgress({
      identifier,
      masteredCards: rest,
    });
  }

  setTimeout(() => {
    if (currentIndex.value < totalDisplayCards.value - 1) {
      ++currentIndex.value;
    }
  }, isFlipped.value ? 200 : 0);

  isFlipped.value = false;
}

function restart() {
  browseIndex.value = 0;
  currentIndex.value = 0;
  isFlipped.value = false;
  results.value = {};
}

async function copyDeckToMyDeck() {
  if (!marketDeck.value) {
    return;
  }

  isCopying.value = true;

  try {
    await copyMarketDeck(marketDeck.value);
    localDeck.value = await getDeckDetail(identifier);
    toast.add({ title: 'Đã sao chép bộ thẻ vào Bộ thẻ của tôi', color: 'success', icon: 'i-lucide-check-circle' });
  } catch {
    toast.add({ title: 'Sao chép bộ thẻ thất bại', color: 'error', icon: 'i-lucide-alert-circle' });
  } finally {
    isCopying.value = false;
  }
}

async function deleteCurrentDeck() {
  if (!localDeck.value) {
    return;
  }

  const confirmed = window.confirm('Bạn có chắc muốn xóa bộ thẻ này?');
  if (!confirmed) {
    return;
  }

  await deleteDeck(identifier);
  toast.add({ title: 'Đã xóa bộ thẻ', color: 'success', icon: 'i-lucide-trash' });
  await router.push('/');
}

watch(browseIndex, (val) => {
  currentIndex.value = val;
});

watch(currentIndex, () => {
  isFlipped.value = false;
});

watch(cards, (myCards) => {
  if (!myCards.length) {
    return;
  }

  const validFronts = new Set(myCards.map(card => card.front));
  const cleanedMasteredCards = Object.fromEntries(
    Object.entries(deck.value?.masteredCards ?? {}).filter(([key]) => validFronts.has(key)),
  ) as Record<string, boolean>;

  capturedMasteredCards.value = cleanedMasteredCards;

  updateProgress({
    identifier,
    lastStudied: new Date().toISOString(),
    masteredCards: cleanedMasteredCards,
  });
}, { immediate: true });
</script>

<template>
  <UDashboardPanel id="study-deck">
    <template #header>
      <UDashboardNavbar :title="deck?.name ?? marketDeck?.name ?? 'Bộ thẻ'">
        <template #leading>
          <UDashboardSidebarCollapse />
          <UButton
            to="/"
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            size="sm"
          />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar v-if="isLocalDeck" class="justify-start gap-2">
        <UTooltip text="Xáo trộn thứ tự thẻ">
          <UButton
            :color="isShuffle ? 'primary' : 'neutral'"
            icon="i-lucide-shuffle"
            variant="subtle"
            size="sm"
            @click="isShuffle = !isShuffle; restart()"
          >
            Xáo trộn
          </UButton>
        </UTooltip>
        <UTooltip text="Ẩn thẻ đã thuộc">
          <UButton
            :color="isFilterCorrect ? 'primary' : 'neutral'"
            icon="i-lucide-eye-off"
            variant="subtle"
            size="sm"
            @click="isFilterCorrect = !isFilterCorrect; restart()"
          >
            Ẩn thẻ đã thuộc
          </UButton>
        </UTooltip>
        <UTooltip text="Duyệt qua các thẻ mà không thay đổi tiến độ">
          <UButton
            :color="isBrowseMode ? 'primary' : 'neutral'"
            icon="i-lucide-gallery-horizontal-end"
            variant="subtle"
            size="sm"
            @click="isBrowseMode = !isBrowseMode; restart()"
          >
            Duyệt nhanh
          </UButton>
        </UTooltip>
        <UButton
          color="error"
          variant="subtle"
          icon="i-lucide-trash"
          @click="deleteCurrentDeck"
        >
          Xóa bộ
        </UButton>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="flex h-full flex-col items-center justify-center gap-8 p-6">
        <ClientOnly>
          <template v-if="isLoadingDeck">
            <div class="w-full max-w-lg rounded-2xl relative" style="height: 280px;">
              <USkeleton class="absolute inset-0 rounded-2xl" />
              <p class="absolute inset-0 flex items-center justify-center text-muted text-sm animate-pulse">
                Đang tải bộ thẻ...
              </p>
            </div>
          </template>

          <template v-else-if="isLocalDeck">
            <template v-if="!cards.length">
              <div class="flex flex-col items-center gap-4 text-center">
                <div class="bg-error/10 flex size-20 items-center justify-center rounded-full">
                  <UIcon name="i-lucide-globe-off" class="text-error size-10" />
                </div>
                <p class="text-muted text-sm">Không tìm thấy thẻ nào trong bộ này.</p>
                <UButton to="/" icon="i-lucide-house">
                  Về trang chủ
                </UButton>
              </div>
            </template>

            <template v-else>
              <div class="w-full max-w-4xl rounded-2xl border border-default bg-default/20 p-6 shadow-sm">
                <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p class="text-2xl font-semibold">{{ deck?.name }}</p>
                    <p class="text-sm text-muted">{{ deck?.description }}</p>
                  </div>
                  <div class="flex flex-wrap gap-2 text-sm text-muted">
                    <span>{{ totalDeckCards }} thẻ</span>
                    <span>Tiến độ: {{ progressPercent }}%</span>
                  </div>
                </div>

                <div class="mt-8 w-full">
                  <div class="flex flex-col gap-4">
                    <div class="rounded-3xl border border-default bg-elevated/70 p-6">
                      <div class="flex items-center justify-between gap-4">
                        <div>
                          <p class="text-base font-semibold">Thẻ hiện tại</p>
                          <p class="text-sm text-muted">{{ currentIndex + 1 }} / {{ totalDisplayCards }}</p>
                        </div>
                        <UButton
                          icon="i-lucide-refresh-ccw"
                          variant="subtle"
                          color="neutral"
                          size="sm"
                          @click="restart"
                        >
                          Làm lại
                        </UButton>
                      </div>

                      <div class="mt-6">
                        <div class="rounded-3xl border border-default bg-default px-6 py-8 text-center">
                          <p class="text-lg font-semibold">{{ currentCard?.front }}</p>
                          <p class="mt-4 text-sm text-muted">{{ currentCard?.backSub }}</p>
                        </div>
                      </div>
                    </div>

                    <div class="flex flex-col gap-3 md:flex-row">
                      <UButton
                        class="flex-1"
                        color="success"
                        @click="answer(true)"
                      >
                        Đúng
                      </UButton>
                      <UButton
                        class="flex-1"
                        color="error"
                        variant="outline"
                        @click="answer(false)"
                      >
                        Sai
                      </UButton>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </template>

          <template v-else-if="isMarketDeck">
            <div class="w-full max-w-lg rounded-3xl border border-default bg-default/30 p-8 text-center">
              <div class="mb-4">
                <p class="text-lg font-semibold">{{ marketDeck?.name }}</p>
                <p class="text-sm text-muted">{{ marketDeck?.description }}</p>
              </div>
              <p class="text-muted">Bạn phải sao chép bộ này vào "Bộ thẻ của tôi" trước khi học.</p>
              <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <UButton
                  :loading="isCopying"
                  color="primary"
                  @click="copyDeckToMyDeck"
                >
                  {{ isCopying ? 'Đang sao chép...' : 'Sao chép bộ thẻ' }}
                </UButton>
                <UButton to="/market" variant="subtle" color="neutral">
                  Quay lại Market
                </UButton>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="flex flex-col items-center gap-4 text-center">
              <div class="bg-error/10 flex size-20 items-center justify-center rounded-full">
                <UIcon name="i-lucide-alert-circle" class="text-error size-10" />
              </div>
              <h2 class="text-default text-2xl font-bold">Không tìm thấy bộ thẻ</h2>
              <p class="text-muted">Bộ thẻ này không tồn tại hoặc chưa được sao chép vào Bộ thẻ của tôi.</p>
              <div class="flex gap-3">
                <UButton to="/" icon="i-lucide-home">Về trang chủ</UButton>
                <UButton to="/market" variant="subtle">Xem Market</UButton>
              </div>
            </div>
          </template>
        </ClientOnly>
      </div>
    </template>
  </UDashboardPanel>
</template>
