<script setup lang="ts">
import { type Card, cardSchema } from './types';

type Props = {
  card: Card & { id: string };
};
const props = defineProps<Props>();
const modalOpen = defineModel<boolean>('open');

const toast = useToast();
const { updateCard } = useMyDecks();

const state = reactive<Card>({
  front: props.card.front,
  back: props.card.back,
  backSub: props.card.backSub,
});
const formRef = useTemplateRef('formRef');

watch(modalOpen, (value) => {
  if (value) {
    state.front = props.card.front;
    state.back = props.card.back;
    state.backSub = props.card.backSub;
  }
});

async function handleUpdateCard() {
  try {
    await updateCard(props.card.id, { ...state });
    modalOpen.value = false;
    toast.add({ title: 'Đã thêm thẻ mới', color: 'success', icon: 'i-lucide-check-circle' });
  } catch {
    toast.add({ title: 'Thêm thẻ thất bại', color: 'error', icon: 'i-lucide-alert-circle' });
  }
}
</script>

<template>
  <UModal
    v-model:open="modalOpen"
    title="Thêm thẻ mới"
  >
    <template #body>
      <UForm
        ref="formRef"
        :schema="cardSchema"
        :state="state"
        class="space-y-4 w-full"
        @submit.prevent="handleUpdateCard"
      >
        <UFormField label="Mặt trước" name="front" required>
          <UInput v-model="state.front" class="w-full" placeholder="こんにちは"/>
        </UFormField>

        <UFormField label="Mặt sau" name="back" required>
          <UInput v-model="state.back" class="w-full" placeholder="Xin chào"/>
        </UFormField>

        <UFormField label="Mặt sau (bổ sung)" name="backSub">
          <UInput v-model="state.backSub" class="w-full" placeholder="Ghi chú / cách dùng / từ khóa"/>
        </UFormField>

        <!-- Hidden submit button to trigger form submission on "Enter" key press -->
        <button type="submit" class="hidden" />
      </UForm>
    </template>

    <template #footer>
      <UButton
        label="Xác nhận"
        color="primary"
        variant="solid"
        :disabled="!!formRef?.errors.length"
        @click="formRef?.submit()"
      />
    </template>
  </UModal>
</template>
