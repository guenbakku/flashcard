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
      label: 'Quản lý thẻ',
      icon: 'i-lucide-wallet-cards',
      onSelect: () => navigateTo({ name: 'decks-deckId-cards', params: { deckId: id } }),
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
      <div class="p-4 sm:p-6">
        <ClientOnly>
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

          <div v-else-if="deckDocs.length === 0" class="flex justify-center py-20 px-4 sm:px-0">
            <UEmpty
              icon="i-lucide-book-open"
              title="Chưa có bộ thẻ nào"
              description="Bắt đầu bằng cách tạo bộ thẻ đầu tiên. Sau đó, bạn có thể ôn tập nhanh, tổ chức nội dung và theo dõi tiến trình học tập dễ dàng."
              class="max-w-xl text-center"
            >
              <template #actions>
                <div class="flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <UButton
                    color="primary"
                    variant="solid"
                    icon="i-lucide-plus"
                    @click="creationModalOpen = true"
                  >
                    Tạo bộ thẻ mới
                  </UButton>
                  <UButton
                    color="neutral"
                    variant="outline"
                    size="sm"
                    icon="i-lucide-store"
                    :to="{ name: 'market' }"
                  >
                    Khám phá bộ thẻ có sẵn
                  </UButton>
                </div>
              </template>
            </UEmpty>
          </div>

          <UPageGrid v-else class="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <UPageCard
              v-for="deck in deckDocs"
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
                <p class="text-sm text-muted whitespace-pre-line line-clamp-3">
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
                  Học lần cuối: {{ formatDatetime(deck.lastStudied) ?? 'Chưa học' }}
                </p>
              </div>

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
            </UPageCard>
          </UPageGrid>
        </ClientOnly>
      </div>
    </template>
  </UDashboardPanel>

  <ModalDeckCreation v-model:open="creationModalOpen"/>
  <ModalDeckUpdation v-model:open="updationModalOpen" :deck="selectingDeck" />
  <ModalDeckDeletion v-model:open="deletionModalOpen" :deck="selectingDeck" />
</template>
