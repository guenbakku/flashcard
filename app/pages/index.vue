<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Welcome">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-4 sm:p-6">
        <ClientOnly>
          <div class="flex flex-col items-center justify-center gap-4 py-16">
            <div class="bg-primary/10 flex size-20 items-center justify-center rounded-full">
              <UIcon name="i-lucide-smile" class="text-primary/80 size-10" />
            </div>
            <p>Xin chào</p>
            <UButton
              :to="{ name: 'decks' }"
              label="Xem bộ thẻ của tôi"
              variant="subtle"
            />
          </div>
        </ClientOnly>
      </div>
    </template>
  </UDashboardPanel>
</template>
