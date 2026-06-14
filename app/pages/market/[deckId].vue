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

const handleBrowse = (direction: 'next' | 'prev') => {
  setTimeout(
    () => {
      switch (direction) {
        case 'next':
          if (currentIndex.value < totalDeckCards.value - 1) {
            currentIndex.value++;
          }
          break;
        case 'prev':
          if (currentIndex.value > 0) {
            currentIndex.value--;
          }
          break;
      }
    },
    // Purpose of 200ms: delay loading new data until the card flipping back completely
    isFlipped.value ? 200 : 0,
  );

  isFlipped.value = false;
};
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
                <UIcon name="i-lucide-server-crash" class="text-muted size-10" />
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
            <FlashCard
              v-model:flip="isFlipped"
              :front="currentCard.front"
              :back="currentCard.back"
              :back-sub="currentCard.backSub"
            />

            <!-- Progress -->
            <div class="w-full max-w-lg space-y-1">
              <div class="flex items-center justify-between text-xs mb-2">
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
                @click="handleBrowse('prev')"
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
                @click="handleBrowse('next')"
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
