<script setup lang="ts">
import { registerGracefulDbClosing } from '~/utils/get-indexed-db';

registerGracefulDbClosing();

const colorMode = useColorMode();
const color = computed(() => colorMode.value === 'dark' ? '#1b1718' : 'white');

useHead({
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { key: 'theme-color', name: 'theme-color', content: color },
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' },
  ],
  htmlAttrs: {
    lang: 'en',
  },
});

const { public: { siteUrl } } = useRuntimeConfig();

const title = 'Flashcard';
const description = 'Ứng dụng học flashcard';
const ogImage = `${siteUrl}/apple-touch-icon.png`;

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogImage,
  twitterCard: 'summary_large_image',
});
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
