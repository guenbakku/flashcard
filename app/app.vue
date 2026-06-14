<script setup lang="ts">
const { registerGracefulDbClosing } = useIndexedDb();

registerGracefulDbClosing();

const colorMode = useColorMode();
const color = computed(() => colorMode.value === 'dark' ? '#1b1718' : 'white');

useHead({
  meta: () => [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { key: 'theme-color', name: 'theme-color', content: color },
  ],
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
  ],
  htmlAttrs: {
    lang: 'vi',
  },
});

const { public: { siteUrl, siteTitle, siteDescription } } = useRuntimeConfig();
const ogImage = `${siteUrl}/apple-touch-icon.png`;

useSeoMeta({
  title: siteTitle,
  description: siteDescription,
  ogTitle: siteTitle,
  ogDescription: siteDescription,
  ogImage,
  twitterCard: 'summary_large_image',
});
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator />
    <NuxtPwaManifest />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
