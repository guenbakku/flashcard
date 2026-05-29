<script setup lang="ts">
import type { Card } from './types';
const toast = useToast();
const { deleteCard } = useMyDecks();

type Props = {
  card: Card & { id: string };
};
const props = defineProps<Props>();
const modalOpen = defineModel<boolean>('open');

async function handleDeleteCard() {
  try {
    await deleteCard(props.card.id);
    modalOpen.value = false;
    toast.add({ title: 'Đã xóa thẻ', color: 'success', icon: 'i-lucide-check-circle' });
  } catch {
    toast.add({ title: 'Xóa thẻ thất bại', color: 'error', icon: 'i-lucide-alert-circle' });
  }
}
</script>

<template>
  <UModal
    v-model:open="modalOpen"
    title="Xóa thẻ"
  >
    <template #body>
      <p class="text-muted">Bạn có chắc muốn xóa thẻ này?</p>
      <p class="mt-2">{{ props.card.front }}</p>
    </template>

    <template #footer>
      <UButton
        label="Xác nhận"
        color="error"
        variant="solid"
        @click="handleDeleteCard"
      />
    </template>
  </UModal>
</template>
