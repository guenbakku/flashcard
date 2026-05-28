<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui';
import * as z from 'zod';

const toast = useToast();

const { deckDocs, pending, createDeck, deleteDeck, updateDeck, filterDecks } = useMyDecks();

const keyword = useState(() => '');
watchDebounced(keyword, (newVal) => {
  filterDecks(newVal);
}, { debounce: 300 });

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

const formSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'Đây là trường bắt buộc')
    .max(128, 'Nội dung không được vượt quá 128 ký tự'),
  description: z.string()
    .trim()
    .max(128, 'Nội dung không được vượt quá 128 ký tự')
    .optional(),
});

type Schema = z.output<typeof formSchema>;

// Creation Modal
const creationModalOpen = ref(false);
const creationFormRef = useTemplateRef('creationFormRef');
const creationFormState = reactive<Schema>({
  name: '',
  description: '',
});

// Updation Modal & Deletion Modal
const updationModalOpen = ref(false);
const updationFormRef = useTemplateRef('updationFormRef');
const updationFormState = reactive<Schema>({
  name: '',
  description: '',
});
// ---
const deletionModalOpen = ref(false);
const selectingDeckId = ref<string>();

async function handleCreateDeck() {
  try {
    await createDeck({
      name: creationFormState.name,
      description: creationFormState.description,
    });
    creationModalOpen.value = false;
    toast.add({ title: 'Đã tạo bộ thẻ', color: 'success', icon: 'i-lucide-check-circle' });
  } catch {
    toast.add({ title: 'Tạo bộ thẻ thất bại', color: 'error', icon: 'i-lucide-alert-circle' });
  }
}

async function handleUpdateDeck() {
  if (!selectingDeckId.value) {
    return;
  }

  try {
    updateDeck({
      id: selectingDeckId.value,
      name: updationFormState.name,
      description: updationFormState.description,
    });
    updationModalOpen.value = false;
    toast.add({ title: 'Đã lưu bộ thẻ', color: 'success', icon: 'i-lucide-check-circle' });
  } catch {
    toast.add({ title: 'Chỉnh sửa bộ thẻ thất bại', color: 'error', icon: 'i-lucide-alert-circle' });
  }
}

async function handleDeleteDeck() {
  if (!selectingDeckId.value) {
    return;
  }

  try {
    await deleteDeck(selectingDeckId.value);
    deletionModalOpen.value = false;
    toast.add({ title: 'Đã xóa bộ thẻ', color: 'success', icon: 'i-lucide-check-circle' });
  } catch {
    toast.add({ title: 'Xóa bộ thẻ thất bại', color: 'error', icon: 'i-lucide-alert-circle' });
  }
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) {
    return 'Chưa học';
  }

  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

watch(creationModalOpen, (val) => {
  if (val) {
    creationFormState.name = '';
    creationFormState.description = '';
  }
});

watch(updationModalOpen, (val) => {
  if (val) {
    const updatingDeck = deckDocs.value.find(deck => deck.id === selectingDeckId.value);
    updationFormState.name = updatingDeck?.name ?? '';
    updationFormState.description = updatingDeck?.description;
  }
});
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

          <div v-else-if="deckDocs.length === 0" class="flex flex-col items-center justify-center gap-4 py-16">
            <div class="bg-error/10 flex size-20 items-center justify-center rounded-full">
              <UIcon name="i-lucide-frown" class="text-error/80 size-10" />
            </div>
            <p>Không tìm thấy bộ thẻ nào</p>
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
                  Học lần cuối: {{ formatDate(deck.lastStudied) }}
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

  <!-- Creation Modal -->
  <UModal
    v-model:open="creationModalOpen"
    title="Tạo bộ thẻ mới"
  >
    <template #body>
      <UForm
        ref="creationFormRef"
        :schema="formSchema"
        :state="creationFormState"
        class="space-y-4 w-full"
        @submit.prevent="handleCreateDeck"
      >
        <UFormField label="Tên bộ thẻ" name="name" required>
          <UInput v-model="creationFormState.name" class="w-full" />
        </UFormField>

        <UFormField label="Mô tả" name="description">
          <UTextarea v-model="creationFormState.description" class="w-full" />
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
        :disabled="!!creationFormRef?.errors.length"
        @click="creationFormRef?.submit()"
      />
    </template>
  </UModal>

  <!-- Updation Modal -->
  <UModal
    v-model:open="updationModalOpen"
    title="Chỉnh sửa bộ thẻ"
  >
    <template #body>
      <UForm
        ref="updationFormRef"
        :schema="formSchema"
        :state="updationFormState"
        class="space-y-4 w-full"
        @submit.prevent="handleUpdateDeck"
      >
        <UFormField label="Tên bộ thẻ" name="name" required>
          <UInput v-model="updationFormState.name" class="w-full" />
        </UFormField>

        <UFormField label="Mô tả" name="description">
          <UTextarea v-model="updationFormState.description" class="w-full" />
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
        :disabled="!!updationFormRef?.errors.length"
        @click="updationFormRef?.submit()"
      />
    </template>
  </UModal>

  <!-- Deletion Modal -->
  <UModal
    v-model:open="deletionModalOpen"
    title="Xóa bộ thẻ"
  >
    <template #body>
      <p class="text-muted">Bạn có chắc muốn xóa bộ thẻ này?</p>
      <p class="mt-2">{{ deckDocs?.find(deck => deck.id === selectingDeckId)?.name }}</p>
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
