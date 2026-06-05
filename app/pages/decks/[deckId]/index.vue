<script setup lang="ts">
import type { DocTypes } from '~/composables/use-indexed-db';

type DeckDocument = DocTypes['deck'];

const route = useRoute();
const deckId = String(route.params.deckId);

const { getDeck, answer } = useMyDecks();
const { cardDocs } = useCards(deckId);

const deck = ref<DeckDocument | null>(null);
const pending = ref(true);
const isAnswering = ref(false);
const capturedMasteredCards = ref<Set<string>>(new Set());

onMounted(async () => {
  deck.value = await getDeck(deckId);
  capturedMasteredCards.value = new Set(cardDocs.value.filter(c => c.isMastered).map(c => c.id));
  pending.value = false;
});

const isShuffle = ref(false);
const isFilterCorrect = ref(false);
const isBrowseMode = ref(false);
const isFlipped = ref(false);

const browseIndex = ref(0);
const currentIndex = ref(0);
const results = ref<{ [cardId: string]: boolean }>({});

const displayCards = computedWithControl(
  // Exclude 'cardDocs' from the watch source to prevent 'displayCards' from recalculating
  // when a user clicks answer button. Otherwise, the order of 'displayCards' will change
  // unexpectedly when 'isShuffle' is enabled.
  () => [isShuffle.value, isFilterCorrect.value, capturedMasteredCards.value],
  () => {
    const filtered = isFilterCorrect.value
      ? cardDocs.value.filter(c => !capturedMasteredCards.value.has(c.id))
      : cardDocs.value;

    if (!isShuffle.value) {
      return filtered;
    };

    return [...filtered].sort(() => Math.random() - 0.5);
  },
);

const currentCard = computed(() => displayCards.value?.[currentIndex.value]);
const totalDeckCards = computed(() => cardDocs.value.length);
const totalDisplayCards = computed(() => displayCards.value.length);
const totalCorrectAnswers = computed(() => Object.values(results.value).filter(v => v).length);
const progress = computed(() => totalDisplayCards.value ? Math.round((Object.values(results.value).length / totalDisplayCards.value) * 100) : 0);
const isDone = computed(() => !isBrowseMode.value && totalDisplayCards.value && Object.values(results.value).length === totalDisplayCards.value);

async function handleAnswer(result: boolean) {
  if (!currentCard.value) {
    return;
  }

  isAnswering.value = true;
  results.value[currentCard.value.id] = result;

  await answer({
    id: currentCard.value.id,
    isMastered: result,
  });

  setTimeout(
    () => {
      if (currentIndex.value < totalDisplayCards.value - 1) {
        ++currentIndex.value;
      };
    },
    // Purpose of 200ms: delay loading new data until the card flipping back completely
    isFlipped.value ? 200 : 0,
  );

  isFlipped.value = false;
  isAnswering.value = false;
}

function restart() {
  browseIndex.value = 0;
  currentIndex.value = 0;
  isFlipped.value = false;
  results.value = {};
}

function reStudy() {
  isFilterCorrect.value = false;
  capturedMasteredCards.value = new Set(cardDocs.value.filter(c => c.isMastered).map(c => c.id));
  restart();
}

watch(browseIndex, (val) => {
  currentIndex.value = val;
});

watch(currentIndex, () => {
  isFlipped.value = false;
});
</script>

<template>
  <UDashboardPanel id="study-deck">
    <template #header>
      <UDashboardNavbar :title="deck?.name ?? ''">
        <template #leading>
          <UDashboardSidebarCollapse />
          <UButton
            :to="{ name: 'decks' }"
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
            <div class="w-full max-w-lg rounded-2xl relative" style="height: 280px;">
              <USkeleton class="absolute inset-0 rounded-2xl" />
              <p class="absolute inset-0 flex items-center justify-center text-muted text-sm animate-pulse">
                Đang tải thẻ...
              </p>
            </div>
            <div class="w-full max-w-lg space-y-1">
              <div class="flex justify-between">
                <USkeleton class="h-4 w-12 rounded" />
                <USkeleton class="h-4 w-10 rounded" />
              </div>
              <USkeleton class="h-2 w-full rounded" />
            </div>
            <div class="flex w-full max-w-lg gap-3">
              <USkeleton class="h-10 flex-1 rounded-lg" />
              <USkeleton class="h-10 flex-1 rounded-lg" />
            </div>
          </template>

          <!-- STATE: deck data empty -->
          <template v-else-if="!cardDocs?.length">
            <div class="flex flex-col items-center gap-4 text-center">
              <div class="bg-elevated flex size-20 items-center justify-center rounded-full">
                <UIcon name="i-lucide-meh" class="text-muted size-10" />
              </div>
              <h2 class="text-default text-2xl font-bold">
                Chưa có thẻ nào để học!
              </h2>
              <p class="text-muted">Hãy vào mục <strong>Quản lý thẻ</strong> để thêm thẻ mới.</p>
              <div class="flex gap-3">
                <UButton
                  color="primary"
                  variant="soft"
                  icon="i-lucide-wallet-cards"
                  :to="{ name: 'decks-deckId-cards', params: { deckId } }"
                >
                  Quản lý thẻ
                </UButton>
                <UButton
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-house"
                  :to="{ name: 'decks' }"
                >
                  Về trang chủ
                </UButton>
              </div>
            </div>
          </template>

          <!-- STATE: User known all cards -->
          <template v-else-if="isFilterCorrect && totalDeckCards > 0 && totalDisplayCards === 0">
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
                  color="primary"
                  variant="soft"
                  icon="i-lucide-rotate-ccw"
                  @click="reStudy"
                >
                  Ôn lại tất cả
                </UButton>
                <UButton
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-house"
                  :to="{ name: 'decks' }"
                >
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
                Bạn đã thuộc <span class="text-success font-semibold">{{ totalCorrectAnswers }}</span>
                / {{ totalDisplayCards }} thẻ
              </p>
              <div class="flex gap-3">
                <UButton
                  color="primary"
                  variant="soft"
                  icon="i-lucide-rotate-ccw"
                  @click="reStudy"
                >
                  Học lại
                </UButton>
                <UButton
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-house"
                  :to="{ name: 'decks' }"
                >
                  Về trang chủ
                </UButton>
              </div>
            </div>
          </template>

          <!-- STATE: Study -->
          <template v-else-if="currentCard">
            <FlashCard
              v-model:flip="isFlipped"
              :front="currentCard.front"
              :back="currentCard.back"
              :back-sub="currentCard.backSub"
              :is-mastered="isBrowseMode && capturedMasteredCards.has(currentCard.id)"
            />

            <!-- Progress -->
            <div class="w-full max-w-lg space-y-1">
              <div class="flex justify-between text-xs">
                <span class="text-muted">{{ currentIndex + 1 }} / {{ totalDisplayCards }}</span>
                <UBadge
                  :color="progress > 0 ? 'success' : 'neutral'"
                  variant="subtle"
                  size="sm"
                >
                  {{ progress }}%
                </UBadge>
              </div>
              <USlider
                v-if="isBrowseMode"
                v-model="browseIndex"
                :max="totalDisplayCards - 1"
                size="md"
              />
              <UProgress
                v-else
                v-model="progress"
                size="md"
              />
            </div>

            <!-- Actions -->
            <template v-if="isBrowseMode">
              <div class="flex w-full max-w-lg gap-3">
                <UButton
                  color="neutral"
                  variant="subtle"
                  icon="i-lucide-arrow-left"
                  size="lg"
                  class="flex-1 justify-center touch-manipulation"
                  :disabled="browseIndex === 0"
                  @click="--browseIndex"
                >
                  Quay lại
                </UButton>
                <UButton
                  color="neutral"
                  variant="subtle"
                  icon="i-lucide-arrow-right"
                  trailing
                  size="lg"
                  class="flex-1 justify-center touch-manipulation"
                  :disabled="browseIndex === totalDisplayCards - 1"
                  @click="++browseIndex"
                >
                  Tiếp theo
                </UButton>
              </div>
            </template>
            <template v-else>
              <div class="flex w-full max-w-lg gap-3">
                <UButton
                  color="error"
                  variant="subtle"
                  icon="i-lucide-x"
                  size="lg"
                  class="flex-1 justify-center touch-manipulation"
                  :loading="isAnswering"
                  @click="handleAnswer(false)"
                >
                  Chưa thuộc
                </UButton>
                <UButton
                  color="success"
                  variant="subtle"
                  icon="i-lucide-check"
                  size="lg"
                  class="flex-1 justify-center touch-manipulation"
                  :loading="isAnswering"
                  @click="handleAnswer(true)"
                >
                  Đã thuộc
                </UButton>
              </div>
            </template>

            <p class="text-muted text-xs">
              {{ isBrowseMode ? 'Chế độ duyệt nhanh – tiến độ không thay đổi' : '&nbsp;' }}
            </p>
          </template>

          <!-- STATE: Unknown -->
          <template v-else>
            <p>Ops!!! Something went wrong.</p>
          </template>
        </ClientOnly>
      </div>
    </template>
  </UDashboardPanel>
</template>
