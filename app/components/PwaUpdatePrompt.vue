<template>
  <div v-if="$pwa?.needRefresh" class="pwa-toast">
    <p>A new version of the app is available!</p>
    <UButton @click="updateApp">Update & Reload</UButton>
  </div>
</template>

<script setup>
const { $pwa } = useNuxtApp();

const updateApp = async () => {
  if ($pwa?.updateServiceWorker) {
    // Triggers the service worker to skipWaiting and take control
    await $pwa.updateServiceWorker(true);
    // Force native reload to display the new application version
    window.location.reload();
  }
};
</script>

<style scoped>
.pwa-toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #333;
  color: white;
  padding: 15px;
  border-radius: 8px;
  z-index: 9999;
}
</style>
