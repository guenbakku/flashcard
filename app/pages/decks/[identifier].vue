<script setup lang="ts">
const route = useRoute();
const identifier = String(route.params.identifier);

const { getDeck, updateDeck } = useDecks();
const deck = computed(() => getDeck(identifier));

const { data, pending } = useDeck(identifier);
const cards = computed(() => data.value?.cards ?? []);

const capturedMasteredCards = ref<Record<string, boolean>>({});

const isShuffle = ref(false);
const isFilterCorrect = ref(false);
const isBrowseMode = ref(false);

const displayCards = computed(() => {
  if (!cards.value) {
    return [];
  };

  const filtered = isFilterCorrect.value
    ? cards.value.filter(c => !capturedMasteredCards.value[c.front])
    : cards.value;

  if (!isShuffle.value) {
    return filtered;
  };
  return [...filtered].sort(() => Math.random() - 0.5);
});

const currentIndex = ref(0);
const isFlipped = ref(false);
const results = ref<Record<string, boolean>>({});

const currentCard = computed(() => displayCards.value?.[currentIndex.value]);
const total = computed(() => displayCards.value?.length ?? 0);
const progress = computed(() => total.value ? Math.round((Object.values(results.value).length / total.value) * 100) : 0);
const correctCount = computed(() => Object.values(results.value).filter(v => v).length);
const isDone = computed(() => !isBrowseMode.value && total.value && Object.values(results.value).length === total.value);

function flip() {
  isFlipped.value = !isFlipped.value;
}

function answer(result: boolean) {
  if (!currentCard.value) {
    return;
  }

  results.value[currentCard.value.front] = result;

  // Update the learning status of the card in the deck
  // If answered correctly, add the card to the mastered list
  // If answered incorrectly, remove the card from the mastered list (if exists)
  if (result) {
    updateDeck(identifier, {
      masteredCards: {
        ...deck.value?.masteredCards,
        ...{[currentCard.value.front]: true},
      },
    });
  } else {
    if (deck.value) {
      const {[currentCard.value.front]: _delete, ...rest} = deck.value.masteredCards;
      updateDeck(identifier, {
        masteredCards: rest,
      });
    }
  }

  isFlipped.value = false;
  setTimeout(() => {
    if (currentIndex.value < total.value - 1) {
      ++currentIndex.value;
    };
  }, 200);
}

function restart() {
  currentIndex.value = 0;
  isFlipped.value = false;
  results.value = {};
}

watch(cards, (myCards) => {
  if (myCards.length) {
    // Remove stale card IDs from masteredCards that no longer exist in the fetched deck JSON.
    // This can happen when the deck data is updated (cards renamed or removed).
    const validFronts = new Set(myCards.map(c => c.front));
    const cleanedMasteredCards = Object.fromEntries(
      Object.entries(deck.value?.masteredCards ?? {}).filter(([key]) => validFronts.has(key)),
    );

    capturedMasteredCards.value = cleanedMasteredCards;

    updateDeck(identifier, {
      lastStudied: new Date().toISOString(),
      masteredCards: cleanedMasteredCards, // persist cleaned data back to localStorage
    });
  }
}, {immediate: true});
</script>

<template>
  <UDashboardPanel id="study-deck">
    <template #header>
      <UDashboardNavbar :title="deck?.name ?? ''">
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

      <UDashboardToolbar class="justify-start gap-2">
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
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="flex h-full flex-col items-center justify-center gap-8 p-6">
        <ClientOnly>
          <!-- STATE: Fetching deck data -->
          <template v-if="pending">
            <div class="w-full max-w-lg space-y-1">
              <div class="flex justify-between">
                <USkeleton class="h-4 w-12 rounded" />
                <USkeleton class="h-4 w-10 rounded" />
              </div>
              <USkeleton class="h-2 w-full rounded" />
            </div>
            <div class="w-full max-w-lg rounded-2xl relative" style="height: 280px;">
              <USkeleton class="absolute inset-0 rounded-2xl" />
              <p class="absolute inset-0 flex items-center justify-center text-muted text-sm animate-pulse">
                Đang tải thẻ...
              </p>
            </div>
            <div class="flex w-full max-w-lg gap-3">
              <USkeleton class="h-10 flex-1 rounded-lg" />
              <USkeleton class="h-10 flex-1 rounded-lg" />
            </div>
          </template>

          <!-- STATE: deck data empty -->
          <template v-else-if="!cards?.length">
            <div class="flex flex-col items-center gap-4 text-center">
              <div class="bg-error/10 flex size-20 items-center justify-center rounded-full">
                <UIcon name="i-lucide-globe-off" class="text-error size-10" />
              </div>
              <p class="text-muted text-sm">Không tìm thấy thẻ nào để học</p>
              <UButton to="/" icon="i-lucide-house">
                Về trang chủ
              </UButton>
            </div>
          </template>

          <!-- STATE: User known all cards -->
          <template v-else-if="isFilterCorrect && !currentCard && cards?.length">
            <div class="flex flex-col items-center gap-4 text-center">
              <div class="bg-success/10 flex size-20 items-center justify-center rounded-full">
                <UIcon name="i-lucide-party-popper" class="text-success size-10" />
              </div>
              <h2 class="text-default text-2xl font-bold">
                Chúc mừng!
              </h2>
              <p class="text-muted">
                Bạn đã thuộc hết tất cả thẻ trong bộ này
              </p>
              <div class="flex gap-3">
                <UButton
                  color="neutral"
                  variant="subtle"
                  icon="i-lucide-rotate-ccw"
                  @click="isFilterCorrect = false; restart()"
                >
                  Ôn lại tất cả
                </UButton>
                <UButton to="/" icon="i-lucide-house">
                  Về trang chủ
                </UButton>
              </div>
            </div>
          </template>

          <!-- STATE: User done all cards -->
          <template v-else-if="isDone">
            <div class="flex flex-col items-center gap-4 text-center">
              <div class="bg-success/10 flex size-20 items-center justify-center rounded-full">
                <UIcon name="i-lucide-trophy" class="text-success size-10" />
              </div>
              <h2 class="text-default text-2xl font-bold">
                Hoàn thành!
              </h2>
              <p class="text-muted">
                Bạn đã thuộc <span class="text-success font-semibold">{{ correctCount }}</span>
                / {{ total }} thẻ
              </p>
              <div class="flex gap-3">
                <UButton
                  color="neutral"
                  variant="subtle"
                  icon="i-lucide-rotate-ccw"
                  @click="restart"
                >
                  Học lại
                </UButton>
                <UButton to="/" icon="i-lucide-house">
                  Về trang chủ
                </UButton>
              </div>
            </div>
          </template>

          <!-- STATE: Study -->
          <template v-else-if="currentCard">
            <!-- Progress -->
            <div class="w-full max-w-lg space-y-1">
              <div class="flex justify-between text-xs">
                <span class="text-muted">{{ currentIndex + 1 }} / {{ total }}</span>
                <UBadge
                  :color="progress > 0 ? 'success' : 'neutral'"
                  variant="subtle"
                  size="sm"
                >
                  {{ progress }}%
                </UBadge>
              </div>
              <UProgress v-model="progress" size="sm" />
            </div>

            <!-- Flip card -->
            <div
              class="flashcard-scene w-full max-w-lg cursor-pointer relative"
              style="height: 280px; perspective: 1000px;"
              @click="flip"
            >
              <div
                class="flashcard-card relative size-full"
                style="transform-style: preserve-3d; transition: transform 0.5s;"
                :style="{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }"
              >
                <!-- Front -->
                <UBadge
                  v-if="isBrowseMode && capturedMasteredCards[currentCard.front]"
                  color="primary"
                  variant="subtle"
                  size="md"
                  class="absolute top-2 right-2 z-10"
                  style="backface-visibility: hidden;"
                >
                  <UIcon name="i-lucide-check" class="size-3" />
                  Đã thuộc
                </UBadge>
                <div
                  class="bg-default border-default absolute inset-0 flex flex-col items-center justify-between rounded-2xl border p-8 py-6 shadow-lg"
                  style="backface-visibility: hidden;"
                >
                  <p class="text-muted mb-4 text-xs uppercase tracking-widest">
                    Mặt trước
                  </p>
                  <p class="text-default text-5xl font-bold">
                    {{ currentCard.front }}
                  </p>
                  <p class="text-muted mt-6 text-sm">
                    Nhấn để lật thẻ
                  </p>
                </div>

                <!-- Back -->
                <div
                  class="bg-primary absolute inset-0 flex flex-col items-center justify-between rounded-2xl p-8 py-6 shadow-lg"
                  style="backface-visibility: hidden; transform: rotateY(180deg);"
                >
                  <p class="mb-4 text-xs uppercase tracking-widest text-black/70">
                    Mặt sau
                  </p>
                  <div>
                    <p class="text-3xl font-bold text-black text-center">
                      {{ currentCard.back }}
                    </p>
                    <p
                      v-if="currentCard.backSub !== undefined"
                      class="text-2xl font-bold text-black text-center"
                    >
                      {{ currentCard.backSub }}
                    </p>
                  </div>
                  <p>&nbsp;</p>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <template v-if="isBrowseMode">
              <div class="flex w-full max-w-lg gap-3">
                <UButton
                  color="neutral"
                  variant="subtle"
                  icon="i-lucide-arrow-left"
                  size="lg"
                  class="flex-1 justify-center"
                  :disabled="currentIndex === 0"
                  @click="currentIndex--; isFlipped = false"
                >
                  Quay lại
                </UButton>
                <UButton
                  color="neutral"
                  variant="subtle"
                  icon="i-lucide-arrow-right"
                  trailing
                  size="lg"
                  class="flex-1 justify-center"
                  :disabled="currentIndex === total - 1"
                  @click="currentIndex++; isFlipped = false"
                >
                  Tiếp theo
                </UButton>
              </div>
              <p class="text-muted text-xs">
                Chế độ duyệt nhanh – tiến độ không thay đổi
              </p>
            </template>
            <template v-else>
              <div class="flex w-full max-w-lg gap-3">
                <UButton
                  color="error"
                  variant="subtle"
                  icon="i-lucide-x"
                  size="lg"
                  class="flex-1 justify-center"
                  :disabled="!isFlipped"
                  @click="answer(false)"
                >
                  Chưa thuộc
                </UButton>
                <UButton
                  color="success"
                  variant="subtle"
                  icon="i-lucide-check"
                  size="lg"
                  class="flex-1 justify-center"
                  :disabled="!isFlipped"
                  @click="answer(true)"
                >
                  Đã thuộc
                </UButton>
              </div>
              <p class="text-muted text-xs">
                Lật thẻ trước khi chọn Chưa Thuộc / Đã thuộc
              </p>
            </template>
          </template>

          <!-- STATE: Unknown -->
          <template v-else>
            <p>Ops!!! Some thing went wrong.</p>
          </template>
        </ClientOnly>
      </div>
    </template>
  </UDashboardPanel>
</template>
