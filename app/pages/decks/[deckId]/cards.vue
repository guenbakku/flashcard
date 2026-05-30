<script setup lang="ts">
import { useSortable, type UseSortableOptions } from '@vueuse/integrations/useSortable';
import type { RxDocument } from 'rxdb';

import type { DocTypes } from '~/utils/get-indexed-db';

import ModalCardCreation from './_components/ModalCardCreation.vue';
import ModalCardDeletion from './_components/ModalCardDeletion.vue';
import ModalCardUpdation from './_components/ModalCardUpdation.vue';

type DeckDocument = DocTypes['deck'];

const route = useRoute();
const deckId = String(route.params.deckId);

const { getDeck } = useMyDecks();
const { cardDocs, reorderCards } = useCards(deckId);

const deck = ref<RxDocument<DeckDocument> | null>(null);
const pending = ref(true);

const creationModalOpen = ref(false);
const updationModalOpen = ref(false);
const deletionModalOpen = ref(false);
const editingCardId = ref<string | null>(null);
const selectingCard = computed(() => cardDocs.value.find(card => card.id === editingCardId.value) ?? { id: '', front: '', back: '' });

const sortableRoot = useTemplateRef('sortableRoot');
useSortable(sortableRoot, cardDocs, {
  handle: '.card-drag-handle',
  animation: 120,
  ghostClass: ['border-primary/60', 'bg-primary/5'],
  chosenClass: ['bg-primary/50'],
  watchElement: true,
  scroll: true,
  scrollSensitivity: 50,
  scrollSpeed: 20,
  bubbleScroll: true,
  onUpdate: async (event: { oldIndex?: number; newIndex?: number }) => {
    const oldIndex = event.oldIndex ?? 0;
    const nextIndex = event.newIndex ?? 0;
    const nextCards = [...cardDocs.value];
    const [movedCard] = nextCards.splice(oldIndex, 1);

    if (!movedCard) {
      return;
    }

    nextCards.splice(nextIndex, 0, movedCard);
    await reorderCards(nextCards.map(card => card.toJSON()));
  },
} as UseSortableOptions);

onMounted(async () => {
  deck.value = await getDeck(deckId);
  pending.value = false;
});
</script>

<template>
  <UDashboardPanel id="manage-deck-cards">
    <template #header>
      <UDashboardNavbar title="Quản lý thẻ">
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
    </template>

    <template #body>
      <div class="flex h-full flex-col gap-6 p-4 sm:p-6">
        <div class="flex flex-col items-start gap-2 rounded-2xl border border-default/70 bg-default/40 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div class="space-y-1">
            <p class="text-xs uppercase text-primary">Bộ thẻ hiện tại</p>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-layers" class="text-primary size-4" />
              <h2 class="text-lg font-semibold text-highlighted">{{ deck?.name ?? 'Đang tải...' }}</h2>
            </div>
          </div>
          <UButton
            icon="i-lucide-plus"
            color="primary"
            variant="solid"
            @click="creationModalOpen = true">
            Thêm thẻ mới
          </UButton>
        </div>

        <div class="grid">
          <UCard class="border-default/70 bg-default/40">
            <template #header>
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h3 class="text-base font-semibold text-highlighted">Danh sách thẻ</h3>
                  <p class="text-xs text-muted">Kéo thả vào vùng danh sách để thay đổi thứ tự học.</p>
                </div>
                <UBadge :label="`${cardDocs.length} thẻ`" color="neutral" variant="soft" />
              </div>
            </template>

            <div v-if="pending" class="space-y-3 py-6">
              <USkeleton class="h-20 w-full rounded-xl" />
              <USkeleton class="h-20 w-full rounded-xl" />
              <USkeleton class="h-20 w-full rounded-xl" />
            </div>

            <div v-else-if="cardDocs.length === 0" class="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-default/70 py-10 text-center">
              <UIcon name="i-lucide-wallet-cards" class="text-primary size-10" />
              <p class="text-sm text-muted">Chưa có thẻ nào trong bộ này.</p>
              <UButton color="primary" variant="soft" @click="creationModalOpen = true">Thêm thẻ đầu tiên</UButton>
            </div>

            <ul v-else ref="sortableRoot" class="space-y-3">
              <li
                v-for="(card, index) in cardDocs"
                :key="card.id"
                class="rounded-2xl border border-default/70 bg-default/60 p-4 hover:border-primary/40 hover:bg-primary/5"
              >
                <div class="flex items-start gap-3">
                  <div class="flex flex-col gap-2">
                    <UBadge
                      :label="`#${index + 1}`"
                      color="neutral"
                      variant="soft"
                      class="text-center"
                    />
                    <UButton
                      icon="i-lucide-grip-vertical"
                      class="card-drag-handle mt-1 rounded-lg border border-default/70 bg-default/70 p-2 text-muted hover:text-highlighted cursor-grab active:cursor-grabbing"
                    />
                  </div>

                  <div class="min-w-0 flex-1 space-y-2">
                    <div class="space-y-1">
                      <p class="text-sm font-semibold text-highlighted">{{ card.front }}</p>
                      <p class="text-sm text-muted">{{ card.back }}</p>
                      <p v-if="card.backSub" class="text-xs text-muted">{{ card.backSub }}</p>
                    </div>
                  </div>

                  <div class="flex flex-col items-center justify-between gap-2">
                    <UButton
                      icon="i-lucide-pencil"
                      size="sm"
                      color="neutral"
                      variant="ghost"
                      @click="editingCardId = card.id; updationModalOpen = true">
                      Sửa
                    </UButton>
                    <UButton
                      icon="i-lucide-trash"
                      size="sm"
                      color="error"
                      variant="ghost"
                      @click="editingCardId = card.id; deletionModalOpen = true">
                      Xóa
                    </UButton>
                  </div>
                </div>
              </li>
            </ul>
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <ModalCardCreation v-model:open="creationModalOpen" :deck-id="deckId" />
  <ModalCardUpdation v-model:open="updationModalOpen" :deck-id="deckId" :card="selectingCard" />
  <ModalCardDeletion v-model:open="deletionModalOpen" :deck-id="deckId" :card="selectingCard" />
</template>
