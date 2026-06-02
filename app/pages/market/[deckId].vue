<script setup lang="ts">
import ModalDeckCopy from './_components/ModalDeckCopy.vue';

const route = useRoute();
const id = String(route.params.deckId);

const { getDeck, pending: decksListPending } = useMarketDecks();
const deck = computed(() => getDeck(id));

const { data, pending: deckDetailPending } = useMarketDeck(id);
const cards = computed(() => data.value?.cards ?? []);
const pending = computed(() => decksListPending.value || deckDetailPending.value);

const isFlipped = ref(false);
const currentIndex = ref(0);
const currentCard = computed(() => cards.value?.[currentIndex.value]);
const totalDeckCards = computed(() => cards.value.length);

const modalOpen = ref(false);
const isCopyable = computed(() => !!deck.value && cards.value.length > 0);

function flip() {
  isFlipped.value = !isFlipped.value;
}

watch(currentIndex, () => {
  isFlipped.value = false;
});
</script>

<template>
  <UDashboardPanel id="browse-market-deck">
    <template #header>
      <UDashboardNavbar :title="deck?.name ?? ''">
        <template #leading>
          <UDashboardSidebarCollapse />
          <UButton
            :to="{ name: 'market' }"
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            size="sm"
          />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar class="justify-start gap-2">
        <UTooltip text="Lưu bộ thẻ này để sử dụng">
          <UButton
            color="primary"
            icon="i-lucide-download-cloud"
            variant="subtle"
            size="sm"
            :disabled="!isCopyable"
            @click="modalOpen = true"
          >
            Lưu bộ thẻ
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
              </div>
              <USkeleton class="h-2 w-full rounded" />
            </div>
            <div class="flex w-full max-w-lg gap-3">
              <USkeleton class="h-10 flex-1 rounded-lg" />
              <USkeleton class="h-10 flex-1 rounded-lg" />
            </div>
          </template>

          <!-- STATE: deck data empty -->
          <template v-else-if="!cards?.length">
            <div class="flex flex-col items-center gap-4 text-center">
              <div class="bg-elevated flex size-20 items-center justify-center rounded-full">
                <UIcon name="i-lucide-meh" class="text-muted size-10" />
              </div>
              <h2 class="text-default text-2xl font-bold">
                Không tìm thấy thẻ nào
              </h2>
              <p class="text-muted">Đã có lỗi xảy ra trong quá trình lấy dữ liệu. Hãy thử lại sau.</p>
              <UButton :to="{ name: 'market' }" icon="i-lucide-house">
                Về trang chủ
              </UButton>
            </div>
          </template>

          <!-- STATE: Browse cards -->
          <template v-else-if="currentCard">
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

            <!-- Progress -->
            <div class="w-full max-w-lg space-y-1">
              <div class="flex justify-between text-xs">
                <span class="text-muted">{{ currentIndex + 1 }} / {{ totalDeckCards }}</span>
              </div>
              <USlider
                v-model="currentIndex"
                :max="totalDeckCards - 1"
                size="md"
              />
            </div>

            <!-- Actions -->
            <div class="flex w-full max-w-lg gap-3">
              <UButton
                color="neutral"
                variant="subtle"
                icon="i-lucide-arrow-left"
                size="lg"
                class="flex-1 justify-center touch-manipulation"
                :disabled="currentIndex === 0"
                @click="--currentIndex"
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
                :disabled="currentIndex === totalDeckCards - 1"
                @click="++currentIndex"
              >
                Tiếp theo
              </UButton>
            </div>

          </template>

          <!-- STATE: Unknown -->
          <template v-else>
            <p>Ops!!! Something went wrong.</p>
          </template>
        </ClientOnly>
      </div>
    </template>
  </UDashboardPanel>

  <ModalDeckCopy v-if="isCopyable" v-model:open="modalOpen" :deck="deck!" />
</template>
