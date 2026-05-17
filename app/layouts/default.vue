<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';

const open = ref(false);

const links = [
  [
    {
      label: 'Bộ thẻ',
      icon: 'i-lucide-layers',
      to: '/',
      onSelect: () => {
        open.value = false;
      },
    },
  ],
] satisfies NavigationMenuItem[][];
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        {{ collapsed ? 'F' : 'Flashcard' }}
      </template>

      <template #footer="{ collapsed }">
        <UColorModeButton
          :label="collapsed ? undefined : 'Sáng / Tối'"
          variant="ghost"
          color="neutral"
          block
        />
      </template>

      <template #default="{ collapsed }">
        <!-- <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" /> -->

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />
      </template>
    </UDashboardSidebar>
    <slot />
  </UDashboardGroup>
</template>
