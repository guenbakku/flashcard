<script setup lang="ts">
import type { Card, Deck } from '~/types';

const route = useRoute();
const id = Number(route.params.id);

const { data: deck } = await useAsyncData<Deck>(`deck-${id}`, async () => ({
  id,
  name: 'Tiếng Anh cơ bản',
  description: 'Từ vựng tiếng Anh cho người mới bắt đầu',
  cardCount: 4,
  lastStudied: null,
  progress: 0,
}));

const { data: cards } = await useAsyncData<Card[]>(`cards-${id}`, async () => [
  { id: 1, front: '日', back: 'Nhật / Ngày' },
  { id: 2, front: 'Book', back: 'Quyển sách' },
  { id: 3, front: 'Computer', back: 'Máy tính' },
  { id: 4, front: 'Door', back: 'Cái cửa' },
], { default: () => [] });

const currentIndex = ref(0);
const isFlipped = ref(false);
const results = ref<Record<number, 'known' | 'unknown'>>({});

const currentCard = computed(() => cards.value?.[currentIndex.value]);
const total = computed(() => cards.value?.length ?? 0);
const progress = computed(() => total.value ? Math.round((Object.keys(results.value).length / total.value) * 100) : 0);
const knownCount = computed(() => Object.values(results.value).filter(r => r === 'known').length);
const isDone = computed(() => Object.keys(results.value).length === total.value);

function flip() {
  isFlipped.value = !isFlipped.value;
}

function answer(result: 'known' | 'unknown') {
  if (!currentCard.value) return;
  results.value[currentCard.value.id] = result;
  isFlipped.value = false;
  setTimeout(() => {
    if (currentIndex.value < total.value - 1) currentIndex.value++;
  }, 200);
}

function restart() {
  currentIndex.value = 0;
  isFlipped.value = false;
  results.value = {};
}
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
        <template #right>
          <span class="text-muted text-sm">{{ currentIndex + 1 }} / {{ total }}</span>
        </template>
      </UDashboardNavbar>

      <div class="border-default border-b px-4 py-2">
        <UProgress :value="progress" size="sm" />
      </div>
    </template>

    <template #body>
      <div class="flex h-full flex-col items-center justify-center gap-8 p-6">
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
              Bạn đã thuộc <span class="text-success font-semibold">{{ knownCount }}</span>
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

        <!-- Study state -->
        <template v-else-if="currentCard">
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
                class="bg-default border-default absolute inset-0 flex flex-col items-center justify-center rounded-2xl border p-8 shadow-lg"
                style="backface-visibility: hidden;"
              >
                <p class="text-muted mb-4 text-xs uppercase tracking-widest">
                  Từ khóa
                </p>
                <p class="text-default text-4xl font-bold">
                  {{ currentCard.front }}
                </p>
                <p class="text-muted mt-6 text-sm">
                  Nhấn để lật thẻ
                </p>
              </div>

              <!-- Back -->
              <div
                class="bg-primary absolute inset-0 flex flex-col items-center justify-center rounded-2xl p-8 shadow-lg"
                style="backface-visibility: hidden; transform: rotateY(180deg);"
              >
                <p class="mb-4 text-xs uppercase tracking-widest text-white/70">
                  Nghĩa
                </p>
                <p class="text-4xl font-bold text-white">
                  {{ currentCard.back }}
                </p>
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
              @click="answer('unknown')"
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
              @click="answer('known')"
            >
              Đã thuộc
            </UButton>
          </div>

          <p class="text-muted text-xs">
            Lật thẻ trước khi chọn Chưa Thuộc / Đã thuộc
          </p>
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>
