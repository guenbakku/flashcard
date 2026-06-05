<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';

const open = ref(false);

const menus = [
  [
    {
      label: 'Bộ thẻ của tôi',
      icon: 'i-lucide-layers',
      to: '/',
      onSelect: () => open.value = false,
    },
    {
      label: 'Thư viện',
      icon: 'i-lucide-store',
      to: { name: 'market' },
      onSelect: () => open.value = false,
    },
  ],
  [
    {
      label: 'Cài đặt',
      icon: 'i-lucide-settings',
      to: { name: 'settings' },
      onSelect: () => open.value = false,
    },
  ],
] satisfies NavigationMenuItem[][];
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="sidebar"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
    >
      <template #header="{ collapsed }">
        <div class="flex items-center gap-2 px-1">
          <div class="bg-primary flex size-7 shrink-0 items-center justify-center rounded-lg">
            <img
              src="/brand.svg"
              width="20"
              height="20"
              alt="Brand logo"
            >
          </div>
          <span v-if="!collapsed" class="text-highlighted truncate font-semibold">
            Flashcard
          </span>
        </div>
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          :collapsed="collapsed"
          :items="menus[0]"
          orientation="vertical"
          tooltip
          popover
        />
        <USeparator />
        <UNavigationMenu
          :collapsed="collapsed"
          :items="menus[1]"
          orientation="vertical"
          tooltip
          popover
        />
      </template>
    </UDashboardSidebar>
    <slot />
  </UDashboardGroup>
</template>
