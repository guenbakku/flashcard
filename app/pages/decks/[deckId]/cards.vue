<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';

import type { DocTypes } from '~/utils/get-indexed-db';

type DeckDocument = DocTypes['deck'];
type CardDocument = DocTypes['card'];

const UIcon = resolveComponent('UIcon');

const route = useRoute();
const id = String(route.params.deckId);

const { getDeck, getAllCardsOfDeck } = useMyDecks();

const deck = ref<DeckDocument | null>(null);
const cards = ref<CardDocument[]>([]);
const pending = ref(true);

const columns: TableColumn<Pick<CardDocument, 'front' | 'back' | 'backSub'>>[] = [
  {
    accessorKey: 'order',
    header: 'Thứ tự',
    cell: () => h(UIcon, { name: 'i-lucide-menu', class: 'size-4 cursor-pointer card-order' }),
    meta: {
      class: {
        td: 'w-20',
      },
    },
  },
  {
    accessorKey: 'front',
    header: 'Mặt trước',
    cell: ({ row }) => row.getValue('front'),
  },
  {
    accessorKey: 'back',
    header: 'Mặt sau',
    cell: ({ row }) => row.getValue('back'),
  },
  {
    accessorKey: 'backSub',
    header: 'Mặt sau (bổ sung)',
    cell: ({ row }) => row.getValue('backSub'),
  },
];

onMounted(async () => {
  deck.value = await getDeck(id);
  cards.value = await getAllCardsOfDeck(id);
  pending.value = false;
});
</script>

<template>
  <UDashboardPanel id="study-deck">
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
      <div class="flex h-full flex-col">
        <div class="flex items-center gap-2 mb-3">
          <UIcon name="i-lucide-layers" class="text-primary size-4" />
          <p class="text-base text-pretty font-semibold text-highlighted line-clamp-1">{{ deck?.name }}</p>
        </div>
        <USeparator />
        <ClientOnly>
          <UTable
            ref="table"
            sticky
            virtualize
            :data="cards"
            :columns="columns"
            :empty="'Bạn chưa có thẻ nào cả'"
            :ui="{
              tbody: 'my-table-tbody'
            }"
            class="flex-1"
          />
        </ClientOnly>
      </div>
    </template>
  </UDashboardPanel>
</template>
