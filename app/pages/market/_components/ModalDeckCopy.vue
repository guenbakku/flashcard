<script setup lang="ts">
import { type DeckMeta, deckMetaSchema } from './types';

type Props = {
  deck: DeckMeta & { id: string };
};
const props = defineProps<Props>();
const modalOpen = defineModel<boolean>('open');

const toast = useToast();
const { copyMarketDeck } = useMyDecks();

const initialState: DeckMeta = {
  name: '',
  description: undefined,
};
const state = reactive<DeckMeta>({ ...initialState });
const formRef = useTemplateRef('formRef');
const loading = ref(false);

watch(modalOpen, (value) => {
  if (value) {
    state.name = props.deck.name;
    state.description = props.deck.description;
    loading.value = false;
  }
});

async function handleCopyDeck() {
  const deckMeta = {
    id: props.deck.id,
    name: state.name,
    description: state.description,
  };

  try {
    loading.value = true;
    await copyMarketDeck(deckMeta);
    modalOpen.value = false;
    toast.add({
      title: `Lưu bộ thẻ thành công`,
      description: h('span', {}, [
        'Hãy vào ',
        h('strong', { class: 'text-warning' }, 'Bộ thẻ của tôi'),
        ' để bắt đầu sử dụng bộ thẻ vừa lưu.',
      ]),
      color: 'success',
      icon: 'i-lucide-check-circle',
    });
  } catch (e) {
    console.error(e);
    toast.add({ title: 'Lưu bộ thẻ thất bại', color: 'error', icon: 'i-lucide-alert-circle' });
    loading.value = false;
  }
}
</script>

<template>
  <UModal
    v-model:open="modalOpen"
    title="Lưu bộ thẻ"
    description='Bộ thẻ sẽ xuất hiện trong trang "Bộ thẻ của tôi". Bạn có thể sử dụng để học hoặc tự do chỉnh sửa sau khi lưu.'
  >
    <template #body>
      <UForm
        ref="formRef"
        :schema="deckMetaSchema"
        :state="state"
        class="space-y-4 w-full"
        @submit.prevent="handleCopyDeck"
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
