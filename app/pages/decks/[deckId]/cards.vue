<script setup lang="ts">
import { useSortable, type UseSortableOptions } from '@vueuse/integrations/useSortable';
import type { RxDocument } from 'rxdb';

import type { DocTypes } from '~/composables/use-indexed-db';

import ModalCardCreation from './_components/ModalCardCreation.vue';
import ModalCardDeletion from './_components/ModalCardDeletion.vue';
import ModalCardUpdation from './_components/ModalCardUpdation.vue';

type DeckDocument = DocTypes['deck'];

const route = useRoute();
const deckId = String(route.params.deckId);

const { getDeck } = useMyDecks();
const { cardDocs, reorderCards, filterCards } = useCards(deckId);

const keyword = useState(() => '');
const keywordDebounced = refDebounced(keyword, 300);
watch(keywordDebounced, (newVal) => {
  filterCards(newVal);
}, { immediate: true });

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
            to="/"
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            size="md"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-4 sm:p-6">
        <div class="flex flex-col items-start rounded-lg border border-default p-4 mb-4">
          <p class="text-xs uppercase text-primary">Bộ thẻ hiện tại</p>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-layers" class="text-primary size-4" />
            <h2 class="font-semibold text-highlighted">{{ deck?.name ?? 'Đang tải...' }}</h2>
          </div>
        </div>

        <UCard>
          <template #header>
            <div class="flex flex-col sm:flex-row items-start justify-between gap-3 w-full">
              <div class="flex flex-col">
                <h3 class="text-base font-semibold text-highlighted">Danh sách thẻ <UBadge :label="`${cardDocs.length} thẻ`" color="neutral" variant="soft" /></h3>
                <p class="text-xs text-muted">Kéo thả thẻ để thay đổi thứ tự học.</p>
              </div>

              <div class="flex items-center gap-3">
                <UInput
                  v-model="keyword"
                  icon="i-lucide-search"
                  placeholder="Tìm thẻ..."
                  class="w-64 sm:w-80"
                >
                  <template v-if="keyword" #trailing>
                    <UButton
                      icon="i-lucide-x"
                      color="neutral"
                      variant="ghost"
                      size="sm"
                      @click="keyword = ''"
                    />
                  </template>
                </UInput>

                <UButton
                  icon="i-lucide-plus"
                  color="primary"
                  variant="solid"
                  class="rounded-full"
                  size="sm"
                  @click="creationModalOpen = true"
                />
              </div>
            </div>
          </template>

          <div v-if="pending" class="space-y-3 py-6">
            <USkeleton class="h-20 w-full rounded-xl" />
            <USkeleton class="h-20 w-full rounded-xl" />
            <USkeleton class="h-20 w-full rounded-xl" />
          </div>

          <div v-else-if="cardDocs.length === 0" class="flex justify-center">
            <template v-if="keywordDebounced">
              <UEmpty
                class="ring-0"
                icon="i-lucide-meh"
                title="Không tìm thấy thẻ nào"
                description="Hãy thử lại với từ khóa khác."
              />
            </template>
            <template v-else>
              <UEmpty
                class="ring-0"
                icon="i-lucide-wallet-cards"
                title="Chưa có thẻ nào trong bộ này"
                :actions="[
                  {
                    icon: 'i-lucide-plus',
                    label: 'Thêm thẻ đầu tiên',
                    color: 'primary',
                    variant: 'solid',
                    onClick: () => { creationModalOpen = true },
                  }
                ]"
              />
            </template>
          </div>

          <ul v-else ref="sortableRoot" class="space-y-3">
            <li
              v-for="(card, index) in cardDocs"
              :key="card.id"
              class="border border-default bg-elevated/50 hover:border-primary hover:bg-primary/5 p-4"
            >
              <div class="flex items-start gap-3">
                <div class="flex flex-col items-start gap-2">
                  <UBadge
                    :label="`#${index + 1}`"
                    color="primary"
                    variant="soft"
                    class="text-center"
                  />
                  <UButton
                    icon="i-lucide-grip-vertical"
                    color="neutral"
                    variant="subtle"
                    class="card-drag-handle hover:text-highlighted cursor-grab active:cursor-grabbing"
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
    </template>
  </UDashboardPanel>

  <ModalCardCreation v-model:open="creationModalOpen" :deck-id="deckId" />
  <ModalCardUpdation v-model:open="updationModalOpen" :deck-id="deckId" :card="selectingCard" />
  <ModalCardDeletion v-model:open="deletionModalOpen" :deck-id="deckId" :card="selectingCard" />
</template>
