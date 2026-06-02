<script setup lang="ts">
import { type Card, cardSchema } from './types';

type Props = {
  deckId: string;
};
const props = defineProps<Props>();
const modalOpen = defineModel<boolean>('open');

const toast = useToast();
const { createCard } = useCards(props.deckId);

const initialState: Card = {
  front: '',
  back: '',
  backSub: undefined,
};
const state = reactive<Card>({ ...initialState });
const formRef = useTemplateRef('formRef');
const loading = ref(false);

watch(modalOpen, (value) => {
  if (value) {
    state.front = initialState.front;
    state.back = initialState.back;
    state.backSub = initialState.backSub;
    loading.value = false;
  }
});

async function handleCreateCard() {
  try {
    loading.value = true;
    await createCard({ ...state });
    modalOpen.value = false;
    toast.add({ title: 'Đã thêm thẻ mới', color: 'success', icon: 'i-lucide-check-circle' });
  } catch (e) {
    console.error(e);
    toast.add({ title: 'Thêm thẻ thất bại', color: 'error', icon: 'i-lucide-alert-circle' });
    loading.value = false;
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
        @submit.prevent="handleCreateCard"
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
        :loading="loading"
        @click="formRef?.submit()"
      />
    </template>
  </UModal>
</template>
