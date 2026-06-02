<script setup lang="ts">
import { type DeckMeta, deckMetaSchema } from './types';

const modalOpen = defineModel<boolean>('open');

const toast = useToast();
const { createDeck } = useMyDecks();

const initialState: DeckMeta = {
  name: '',
  description: undefined,
};
const state = reactive<DeckMeta>({ ...initialState });
const formRef = useTemplateRef('formRef');
const loading = ref(false);

watch(modalOpen, (value) => {
  if (value) {
    state.name = initialState.name;
    state.description = initialState.description;
    loading.value = false;
  }
});

async function handleCreateDeck() {
  try {
    loading.value = true;
    await createDeck({
      name: state.name,
      description: state.description,
    });
    modalOpen.value = false;
    toast.add({
      title: `Đã tạo bộ thẻ mới "${state.name}"`,
      description: h('span', {}, [
        'Bạn có thể vào mục ',
        h('strong', { class: 'text-warning font-medium' }, 'Quản lý thẻ'),
        ' để thêm thẻ mới cho bộ thẻ này.',
      ]),
      color: 'success',
      icon: 'i-lucide-check-circle',
    });
  } catch (e) {
    console.error(e);
    toast.add({ title: 'Tạo bộ thẻ thất bại', color: 'error', icon: 'i-lucide-alert-circle' });
    loading.value = false;
  }
}
</script>

<template>
  <UModal
    v-model:open="modalOpen"
    title="Tạo bộ thẻ mới"
  >
    <template #body>
      <UForm
        ref="formRef"
        :schema="deckMetaSchema"
        :state="state"
        class="space-y-4 w-full"
        @submit.prevent="handleCreateDeck"
      >
        <UFormField label="Tên bộ thẻ" name="name" required>
          <UInput v-model="state.name" class="w-full" />
        </UFormField>

        <UFormField label="Mô tả" name="description">
          <UTextarea v-model="state.description" class="w-full" />
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
