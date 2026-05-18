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
        <div class="flex items-center gap-2 px-1">
          <div class="bg-primary flex size-7 shrink-0 items-center justify-center rounded-lg">
            <img
              src="/brand.svg"
              width="20"
              height="20"
              alt="Brand logo"
            >
          </div>
          <span v-if="!collapsed" class="text-highlighted truncate font-semibold">Flashcard</span>
        </div>
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />
      </template>

      <template #footer="{ collapsed }">
        <UTooltip text="Giao diện Sáng / Tối">
          <UColorModeButton
            :label="collapsed ? undefined : 'Sáng / Tối'"
            variant="ghost"
            color="neutral"
            block
          />
        </UTooltip>
      </template>
    </UDashboardSidebar>
    <slot />
  </UDashboardGroup>
</template>
