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
    </template>
    <template #body>
      <div class="max-w-6xl space-y-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div class="flex flex-wrap items-center gap-2 w-full">
            <UNavigationMenu
              :items="menuItems"
              orientation="horizontal"
              highlight
              highlight-color="primary"
              class="data-[orientation=horizontal]:border-b border-default data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-48"
            />
          </div>
        </div>
        <NuxtPage />
      </div>
    </template>
  </UDashboardPanel>
</template>
