<script setup lang="ts">
const route = useRoute();
const identifier = String(route.params.identifier);

const { getDeck, updateDeck } = useDecks();
const deck = computed(() => getDeck(identifier));

const { data: cards, pending } = useCards(identifier);

const isShuffle = ref(false);
const displayCards = computed(() => {
  if (!cards.value) {
    return [];
  };
  if (!isShuffle.value) {
    return cards.value;
  };
  return [...cards.value].sort(() => Math.random() - 0.5);
});

const currentIndex = ref(0);
const isFlipped = ref(false);
const results = ref<Record<string, boolean>>({});

const currentCard = computed(() => displayCards.value?.[currentIndex.value]);
const total = computed(() => displayCards.value?.length ?? 0);
const progress = computed(() => total.value ? Math.round((Object.values(results.value).length / total.value) * 100) : 0);
const correctCount = computed(() => Object.values(results.value).filter(v => v).length);
const isDone = computed(() => total.value && Object.values(results.value).length === total.value);

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
      correct: {
        ...deck.value?.correct,
        ...{[currentCard.value.front]: true},
      },
    });
  } else {
    if (deck.value) {
      const {[currentCard.value.front]: _delete, ...rest} = deck.value.correct;
      updateDeck(identifier, {
        correct: rest,
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

watch(cards, () => {
  if (cards.value?.length) {
    updateDeck(identifier, {
      lastStudied: new Date().toISOString(),
    });
  }
}, {immediate: true});
</script>

<template>
  <UDashboardPanel id="study">
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

      <UDashboardToolbar>
        <UTooltip text="Xáo trộn thứ tự thẻ">
          <UButton
            :icon="isShuffle ? 'i-lucide-shuffle' : 'i-lucide-arrow-right'"
            :color="isShuffle ? 'primary' : 'neutral'"
            variant="subtle"
            size="sm"
            @click="isShuffle = !isShuffle; restart()"
          >
            {{ isShuffle ? 'Ngẫu nhiên' : 'Theo thứ tự' }}
          </UButton>
        </UTooltip>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="flex h-full flex-col items-center justify-center gap-8 p-6">
        <ClientOnly>
          <!-- Done state -->
          <template v-if="isDone">
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

          <template v-else-if="pending">
            <p class="text-muted text-xs">Loading card...</p>
          </template>
          <template v-else-if="!currentCard">
            <div class="flex flex-col items-center gap-4 text-center">
              <div class="bg-error/10 flex size-20 items-center justify-center rounded-full">
                <UIcon name="i-lucide-globe-off" class="text-error size-10" />
              </div>
              <p class="text-muted text-sm">Không tìm thấy thẻ nào để học.</p>
              <UButton to="/" icon="i-lucide-house">
                Về trang chủ
              </UButton>
            </div>
          </template>

          <!-- Study state -->
          <template v-else>
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
              class="flashcard-scene w-full max-w-lg cursor-pointer"
              style="height: 280px; perspective: 1000px;"
              @click="flip"
            >
              <div
                class="flashcard-card relative size-full"
                style="transform-style: preserve-3d; transition: transform 0.5s;"
                :style="{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }"
              >
                <!-- Front -->
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
                  <p class="mb-4 text-xs uppercase tracking-widest text-white/70">
                    Mặt sau
                  </p>
                  <div>
                    <p class="text-3xl font-bold text-white text-center">
                      {{ currentCard.back }}
                    </p>
                    <p
                      v-if="currentCard.backSub !== undefined"
                      class="text-2xl font-bold text-white text-center"
                    >
                        {{ currentCard.backSub }}
                    </p>
                  </div>
                  <p>&nbsp;</p>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex w-full max-w-lg gap-3">
              <UButton
                color="error"
                variant="subtle"
                icon="i-lucide-x"
                size="lg"
                class="flex-1"
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
                class="flex-1"
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
        </ClientOnly>
      </div>
    </template>
  </UDashboardPanel>
</template>
