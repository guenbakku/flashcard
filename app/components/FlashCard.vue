<script setup lang="ts">
const flip = defineModel<boolean>('flip');

type Props = {
  front: string;
  back: string;
  backSub?: string;
  isMastered?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  backSub: '',
  isMastered: false,
});
</script>

<template>
  <div
    class="flashcard-scene w-full max-w-lg cursor-pointer relative"
    style="height: 280px; perspective: 1000px;"
    @click="flip = !flip"
  >
    <div
      class="flashcard-card relative size-full"
      style="transform-style: preserve-3d; transition: transform 0.5s;"
      :style="{ transform: flip ? 'rotateY(180deg)' : 'rotateY(0deg)' }"
    >
      <!-- Front -->
      <UBadge
        v-if="props.isMastered"
        color="primary"
        variant="subtle"
        size="md"
        class="absolute top-2 right-2 z-10"
        style="backface-visibility: hidden;"
      >
        <UIcon name="i-lucide-check" class="size-3" />
        Đã thuộc
      </UBadge>
      <div
        class="bg-default border-default absolute inset-0 flex flex-col items-center justify-between rounded-2xl border p-8 py-6 shadow-lg"
        style="backface-visibility: hidden;"
      >
        <p class="text-muted mb-4 text-xs uppercase tracking-widest">
          Mặt trước
        </p>
        <p class="text-default text-5xl font-bold">
          {{ props.front }}
        </p>
        <p class="text-muted mt-6 text-sm">
          Nhấn để lật thẻ
        </p>
      </div>

      <!-- Back -->
      <div
        class="bg-primary/10 border-primary border absolute inset-0 flex flex-col items-center justify-between rounded-2xl p-8 py-6 shadow-lg"
        style="backface-visibility: hidden; transform: rotateY(180deg);"
      >
        <p class="mb-4 text-xs uppercase tracking-widest text-default/70">
          Mặt sau
        </p>
        <div>
          <p class="text-default text-3xl font-bold text-center">
            {{ props.back }}
          </p>
          <template v-if="props.backSub.trim()">
            <USeparator class="my-4" :ui="{ border: 'border-primary/20' }"/>
            <p class="text-default text-lg font-bold text-center">
              {{ props.backSub }}
            </p>
          </template>
        </div>
        <p>&nbsp;</p>
      </div>
    </div>
  </div>
</template>
