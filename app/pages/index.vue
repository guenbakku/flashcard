<script setup lang="ts">
import { refDebounced } from '@vueuse/core';
import { computed, ref } from 'vue';

import type { Card, Deck } from '~/types';
const { decks, pending, createDeck, updateDeck, deleteDeck, getAllCardsOfDeck } = useMyDecks();

const keyword = useState(() => '');
const debouncedKeyword = refDebounced(keyword, 300);
const filteredDecks = computed(() =>
  decks.value?.filter((d) => {
    const term = debouncedKeyword.value.toLowerCase();
    return d.name.toLowerCase().includes(term)
      || (d.description ?? '').toLowerCase().includes(term);
  }) ?? [],
);

const isEditorOpen = ref(false);
const editorMode = ref<'create' | 'edit'>('create');
const editingDeckId = ref<string | null>(null);
const editorName = ref('');
const editorDescription = ref('');
const editorCards = ref<Array<Card & { uid: string }>>([
  { uid: 'card-0', front: '', back: '', backSub: '' },
]);

const toast = useToast();

const canSaveEditor = computed(() => {
  return !!editorName.value.trim()
    && editorCards.value.some(card => card.front.trim() && card.back.trim());
});

function openCreateEditor() {
  resetEditor();
  isEditorOpen.value = true;
}

async function openEditEditor(deck: Deck) {
  isEditorOpen.value = true;
  editorMode.value = 'edit';
  editingDeckId.value = deck.id;
  editorName.value = deck.name;
  editorDescription.value = deck.description;

  const cards = await getAllCardsOfDeck(deck.id) ?? [];
  if (cards?.length) {
    editorCards.value = cards.map((card: Card, index: number) => ({
      uid: `card-${deck.id}-${index}-${Date.now()}`,
      front: card.front,
      back: card.back,
      backSub: card.backSub ?? '',
    }));

    return;
  }

  editorCards.value = [{ uid: 'card-0', front: '', back: '', backSub: '' }];
}

function addCard() {
  editorCards.value.push({
    uid: generateUid(),
    front: '',
    back: '',
    backSub: '',
  });
}

function removeCard(index: number) {
  if (editorCards.value.length <= 1) {
    return;
  }

  editorCards.value.splice(index, 1);
}

function resetEditor() {
  isEditorOpen.value = false;
  editorMode.value = 'create';
  editingDeckId.value = null;
  editorName.value = '';
  editorDescription.value = '';
  editorCards.value = [{ uid: 'card-0', front: '', back: '', backSub: '' }];
}

async function saveDeck() {
  if (!canSaveEditor.value) {
    return;
  }

  const cards = editorCards.value
    .filter(card => card.front.trim() && card.back.trim())
    .map(card => ({
      front: card.front.trim(),
      back: card.back.trim(),
      backSub: card.backSub?.trim() ?? '',
    }));

  if (!cards.length) {
    return;
  }

  try {
    if (editorMode.value === 'edit' && editingDeckId.value) {
      await updateDeck({
        id: editingDeckId.value,
        name: editorName.value.trim(),
        description: editorDescription.value.trim(),
        cards,
      });
      toast.add({ title: 'Đã cập nhật bộ thẻ', color: 'success', icon: 'i-lucide-check-circle' });
    } else {
      await createDeck({
        name: editorName.value.trim(),
        description: editorDescription.value.trim(),
        cards,
      });
      toast.add({ title: 'Đã tạo bộ thẻ mới', color: 'success', icon: 'i-lucide-check-circle' });
    }

    resetEditor();
  } catch {
    toast.add({ title: 'Lưu bộ thẻ thất bại', color: 'error', icon: 'i-lucide-alert-circle' });
  }
}

async function handleDeleteDeck(id: string) {
  const confirmed = window.confirm('Bạn có chắc muốn xóa bộ thẻ này?');
  if (!confirmed) {
    return;
  }

  await deleteDeck(id);
  toast.add({ title: 'Đã xóa bộ thẻ', color: 'success', icon: 'i-lucide-trash' });
}

function updateEditorCard(index: number, field: 'front' | 'back' | 'backSub', value: string) {
  const existingCard = editorCards.value[index] ?? {
    uid: `card-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    front: '',
    back: '',
    backSub: '',
  };

  editorCards.value[index] = {
    ...existingCard,
    front: existingCard.front ?? '',
    back: existingCard.back ?? '',
    backSub: existingCard.backSub ?? '',
    uid: existingCard.uid,
    [field]: value,
  };
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) {
    return 'Chưa học';
  }

  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Bộ thẻ của tôi">
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
        <UButton
          icon="i-lucide-plus"
          color="primary"
          variant="solid"
          class="ml-3"
          @click="openCreateEditor"
        />
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="p-4 sm:p-6">
        <ClientOnly>
          <div v-if="isEditorOpen" class="mb-6">
            <UCard>
              <div class="space-y-4">
                <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p class="text-lg font-semibold">
                      {{ editorMode === 'create' ? 'Tạo bộ thẻ mới' : 'Chỉnh sửa bộ thẻ' }}
                    </p>
                    <p class="text-sm text-muted">
                      Điền tên bộ thẻ, mô tả và nội dung thẻ của bạn.
                    </p>
                  </div>
                  <div class="flex gap-2">
                    <UButton
                      variant="ghost"
                      color="neutral"
                      @click="resetEditor"
                    >
                      Hủy
                    </UButton>
                    <UButton
                      :disabled="!canSaveEditor"
                      color="primary"
                      @click="saveDeck"
                    >
                      Lưu bộ thẻ
                    </UButton>
                  </div>
                </div>

                <div class="grid gap-4 sm:grid-cols-2">
                  <UInput v-model="editorName" label="Tên bộ thẻ" />
                  <UInput v-model="editorDescription" label="Mô tả" />
                </div>

                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <p class="font-semibold">Danh sách thẻ</p>
                    <UButton
                      size="sm"
                      variant="subtle"
                      icon="i-lucide-plus"
                      @click="addCard"
                    >
                      Thêm thẻ
                    </UButton>
                  </div>

                  <div class="space-y-4">
                    <div
                      v-for="(card, index) in editorCards"
                      :key="card.uid"
                      class="grid gap-3 rounded-2xl border border-default p-4"
                    >
                      <div class="grid gap-3 sm:grid-cols-2">
                        <UInput
                          v-model="card.front"
                          label="Mặt trước"
                          @update:model-value="value => updateEditorCard(index, 'front', value)"
                        />
                        <UInput
                          v-model="card.back"
                          label="Mặt sau"
                          @update:model-value="value => updateEditorCard(index, 'back', value)"
                        />
                      </div>
                      <UInput
                        v-model="card.backSub"
                        label="Ghi chú"
                        @update:model-value="value => updateEditorCard(index, 'backSub', value)"
                      />
                      <div class="flex justify-end">
                        <UButton
                          size="sm"
                          variant="ghost"
                          color="error"
                          :disabled="editorCards.length === 1"
                          @click="removeCard(index)"
                        >
                          Xóa thẻ
                        </UButton>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </UCard>
          </div>

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
              :key="deck.id"
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
                <p class="text-sm text-muted line-clamp-3">
                  {{ deck.description }}
                </p>
              </template>
              <div class="mt-auto space-y-2">
                <div class="flex items-center justify-between text-sm">
                  <div class="flex items-center gap-2">
                    <UIcon name="i-lucide-layers" class="text-primary size-4" />
                    <span class="text-muted">{{ deck.cardCount }} thẻ</span>
                  </div>
                  <UBadge
                    :color="deck.progress > 0 ? 'success' : 'neutral'"
                    variant="subtle"
                    size="sm"
                  >
                    {{ deck.progress }}%
                  </UBadge>
                </div>

                <UProgress
                  :model-value="deck.progress"
                  size="sm"
                  color="primary"
                />

                <p class="text-muted text-xs">
                  Học lần cuối: {{ formatDate(deck.lastStudied) }}
                </p>
              </div>

              <template #footer>
                <div class="flex flex-wrap gap-2">
                  <UButton
                    :to="{ name: 'decks-deckId', params: { deckId: deck.id }}"
                    size="sm"
                    variant="subtle"
                    icon="i-lucide-play"
                    class="flex-1"
                  >
                    Học ngay
                  </UButton>
                  <UButton
                    size="sm"
                    variant="subtle"
                    icon="i-lucide-edit"
                    @click="openEditEditor(deck)"
                  >
                    Chỉnh sửa
                  </UButton>
                  <UButton
                    size="sm"
                    color="error"
                    variant="subtle"
                    icon="i-lucide-trash"
                    @click="handleDeleteDeck(deck.id)"
                  >
                    Xóa
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
