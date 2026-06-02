<script setup lang="ts">
import type { DeckMeta } from './types';

type Props = {
  deck: DeckMeta & { id: string };
};
const props = defineProps<Props>();
const modalOpen = defineModel<boolean>('open');

const toast = useToast();
const { deleteDeck } = useMyDecks();

const loading = ref(false);

watch(modalOpen, (value) => {
  if (value) {
    loading.value = false;
  }
});

async function handleDeleteDeck() {
  try {
    loading.value = true;
    await deleteDeck(props.deck.id);
    modalOpen.value = false;
    toast.add({ title: 'Đã xóa bộ thẻ', color: 'success', icon: 'i-lucide-check-circle' });
  } catch (e) {
    console.error(e);
    toast.add({ title: 'Xóa bộ thẻ thất bại', color: 'error', icon: 'i-lucide-alert-circle' });
    loading.value = false;
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
        :loading="loading"
        @click="handleDeleteDeck"
      />
    </template>
  </UModal>
</template>
