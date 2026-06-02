<script setup lang="ts">
import { type DeckMeta, deckMetaSchema } from './types';

type Props = {
  deck: DeckMeta & { id: string };
};
const props = defineProps<Props>();
const modalOpen = defineModel<boolean>('open');

const toast = useToast();
const { updateDeck } = useMyDecks();

const state = reactive<DeckMeta>({
  name: props.deck.name,
  description: props.deck.description,
});
const formRef = useTemplateRef('formRef');
const loading = ref(false);

watch(modalOpen, (value) => {
  if (value) {
    state.name = props.deck.name;
    state.description = props.deck.description;
    loading.value = false;
  }
});

async function handleUpdateDeck() {
  try {
    loading.value = true;
    await updateDeck({
      id: props.deck.id,
      name: state.name,
      description: state.description,
    });
    modalOpen.value = false;
    toast.add({ title: 'Đã lưu bộ thẻ', color: 'success', icon: 'i-lucide-check-circle' });
  } catch (e) {
    console.error(e);
    toast.add({ title: 'Chỉnh sửa bộ thẻ thất bại', color: 'error', icon: 'i-lucide-alert-circle' });
    loading.value = false;
  }
}
</script>

<template>
  <UModal
    v-model:open="modalOpen"
    title="Chỉnh sửa bộ thẻ"
  >
    <template #body>
      <UForm
        ref="formRef"
        :schema="deckMetaSchema"
        :state="state"
        class="space-y-4 w-full"
        @submit.prevent="handleUpdateDeck"
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
