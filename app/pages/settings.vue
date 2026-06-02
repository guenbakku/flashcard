<script setup lang="ts">
const menuItems = [
  {
    label: 'Cài đặt chung',
    icon: 'i-lucide-sliders-horizontal',
    to: { name: 'settings-general' },
  },
  {
    label: 'Sao lưu dữ liệu',
    icon: 'i-lucide-arrow-left-right',
    to: { name: 'settings-data-transfer' },
  },
];

</script>

<template>
  <UDashboardPanel id="settings">
    <template #header>
      <UDashboardNavbar title="Cài đặt">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar class="justify-start gap-2">
        <UNavigationMenu
          :items="menuItems"
          orientation="horizontal"
          highlight
          highlight-color="primary"
        />
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="max-w-4xl">
        <NuxtPage />
      </div>
    </template>
  </UDashboardPanel>
</template>
