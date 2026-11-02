<script setup lang="ts">
useScrollTracker()
</script>

<template>
  <div>
    <a href="#main" class="sr-only z-[70] rounded bg-lab-signal px-4 py-2 font-medium text-lab-bg focus:not-sr-only focus:fixed focus:left-4 focus:top-4">跳到主要內容</a>
    <LayoutAppHeader />
    <!-- No top padding: the first block of every page (hero / page header / breadcrumb) clears the fixed header itself. -->
    <main id="main" class="min-h-screen w-full bg-background">
      <slot />
    </main>
    <LayoutAppFooter />
    <LayoutBackToTop />
  </div>
</template>
