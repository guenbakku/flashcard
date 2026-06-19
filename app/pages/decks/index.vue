<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui';

import ModalDeckCreation from './_components/ModalDeckCreation.vue';
import ModalDeckDeletion from './_components/ModalDeckDeletion.vue';
import ModalDeckUpdation from './_components/ModalDeckUpdation.vue';

const { deckDocs, pending, filterDecks } = useMyDecks();

const keyword = useState(() => '');
const keywordDebounced = refDebounced(keyword, 300);
watch(keywordDebounced, (newVal) => {
  filterDecks(newVal);
}, { immediate: true });

const creationModalOpen = ref(false);
const updationModalOpen = ref(false);
const deletionModalOpen = ref(false);
// ---
const selectingDeckId = ref<string>();
const selectingDeck = computed(() => deckDocs.value.find(deck => deck.id === selectingDeckId.value) ?? { id: '', name: '' });

function generateDropdownItems(id: string): DropdownMenuItem[] {
  return [
    {
      label: 'Chỉnh sửa',
      icon: 'i-lucide-edit',
      onSelect: () => {
        selectingDeckId.value = id;
        updationModalOpen.value = true;
      },
    },
    {
      label: 'Xóa',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect: () => {
        selectingDeckId.value = id;
        deletionModalOpen.value = true;
      },
    },
  ];
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
        <UTooltip text="Tạo bộ thẻ mới">
          <UButton
            icon="i-lucide-plus"
            color="primary"
            variant="solid"
            class="ml-3 rounded-full"
            size="sm"
            @click="creationModalOpen = true"
          />
        </UTooltip>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="py-3">
        <UPageGrid v-if="pending" class="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div v-for="i in 2" :key="i" class="border border-default bg-elevated rounded-lg p-4 space-y-3">
            <USkeleton class="h-5 w-3/4 rounded bg-default/70" />
            <USkeleton class="h-4 w-full rounded bg-default/70" />
            <USkeleton class="h-8 w-full rounded-lg bg-default/70 mt-2" />
            <div class="pt-2 space-y-2">
              <div class="flex justify-between">
                <USkeleton class="h-4 w-16 bg-default/70 rounded" />
                <USkeleton class="h-4 w-10 bg-default/70 rounded" />
              </div>
              <USkeleton class="h-1 w-full bg-default/70 rounded" />
              <USkeleton class="h-3 w-40 bg-default/70 rounded" />
            </div>
          </div>
        </UPageGrid>

        <div v-else-if="deckDocs.length === 0" class="flex justify-center">
          <template v-if="keywordDebounced">
            <UEmpty
              icon="i-lucide-meh"
              title="Không tìm thấy bộ thẻ nào"
              description="Hãy thử lại với từ khóa khác."
            />
          </template>
          <template v-else>
            <UEmpty
              icon="i-lucide-package-open"
              title="Chưa có bộ thẻ nào"
              description="Bắt đầu bằng cách tạo bộ thẻ mới hoặc lưu các bộ thẻ có sẵn từ Thư viện vào danh sách của bạn để ôn tập ngay."
              :actions="[
                {
                  icon: 'i-lucide-plus',
                  label: 'Tạo bộ thẻ mới',
                  color: 'primary',
                  variant: 'solid',
                  onClick: () => { creationModalOpen = true },
                },
                {
                  icon: 'i-lucide-store',
                  label: 'Khám phá bộ thẻ có sẵn',
                  color: 'neutral',
                  variant: 'outline',
                  to: { name: 'market' },
                }
              ]"
            />
          </template>
        </div>

        <UPageGrid v-else class="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <UPageCard
            v-for="deck in deckDocs"
            :key="deck.id"
            :title="deck.name"
            variant="subtle"
          >
            <template #description>
              <p class="text-sm text-muted whitespace-pre-line line-clamp-3">
                {{ deck.description }}
              </p>
            </template>

            <template #footer>
              <div class="flex gap-3">
                <UButton
                  :to="{ name: 'decks-deckId', params: { deckId: deck.id }}"
                  size="sm"
                  variant="subtle"
                  icon="i-lucide-play"
                >
                  Học ngay
                </UButton>
                <UButton
                  :to="{ name: 'decks-deckId-cards', params: { deckId: deck.id } }"
                  size="sm"
                  color="neutral"
                  variant="subtle"
                  icon="i-lucide-wallet-cards"
                >
                  Quản lý thẻ
                </UButton>
                <UDropdownMenu :items="generateDropdownItems(deck.id)">
                  <UButton
                    size="sm"
                    color="neutral"
                    variant="subtle"
                    icon="i-lucide-ellipsis"
                  />
                </UDropdownMenu>
              </div>
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
                Học lần cuối: {{ formatDatetime(deck.lastStudied) ?? 'Chưa học' }}
              </p>
            </div>
          </UPageCard>
        </UPageGrid>
      </div>
    </template>
  </UDashboardPanel>

  <ModalDeckCreation v-model:open="creationModalOpen"/>
  <ModalDeckUpdation v-model:open="updationModalOpen" :deck="selectingDeck" />
  <ModalDeckDeletion v-model:open="deletionModalOpen" :deck="selectingDeck" />
</template>
