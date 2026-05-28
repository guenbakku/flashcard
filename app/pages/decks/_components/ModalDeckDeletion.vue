<script setup lang="ts">
import type { DeckMeta } from './types';
const toast = useToast();
const { deleteDeck } = useMyDecks();

type Props = {
  deck: DeckMeta & { id: string };
};
const props = defineProps<Props>();
const modalOpen = defineModel<boolean>('open');

async function handleDeleteDeck() {
  try {
    await deleteDeck(props.deck.id);
    modalOpen.value = false;
    toast.add({ title: 'Đã xóa bộ thẻ', color: 'success', icon: 'i-lucide-check-circle' });
  } catch {
    toast.add({ title: 'Xóa bộ thẻ thất bại', color: 'error', icon: 'i-lucide-alert-circle' });
  }
}
</script>

<template>
  <UModal
    v-model:open="modalOpen"
    title="Xóa bộ thẻ"
  >
    <template #body>
      <p class="text-muted">Bạn có chắc muốn xóa bộ thẻ này?</p>
      <p class="mt-2">{{ props.deck.name }}</p>
    </template>

    <template #footer>
      <UButton
        label="Xác nhận"
        color="error"
        variant="solid"
        @click="handleDeleteDeck"
      />
    </template>
  </UModal>
</template>
