<script setup lang="ts">
import { navLinks, site } from '~/data/site'
</script>

<template>
  <footer class="lab-dark w-full border-t border-white/10">
    <div class="section-x">
      <div class="flex flex-col justify-between gap-8 py-space-xl md:flex-row md:items-end">
        <div class="space-y-2">
          <div class="font-heading text-headline-sm text-white">{{ site.name }}</div>
          <p class="lab-muted max-w-md text-body-sm">前端工程師，用 Vue 開發網頁介面，也做 LINE 官方帳號與後台系統。</p>
        </div>
        <nav class="flex flex-wrap items-center gap-x-6 gap-y-2" aria-label="頁尾導覽">
          <NuxtLink v-for="l in navLinks" :key="l.to" :to="l.to" class="text-body-sm text-lab-on-dark-muted transition-colors hover:text-white">{{ l.label }}</NuxtLink>
          <a :href="site.github" target="_blank" rel="noopener noreferrer" class="text-body-sm text-lab-on-dark-muted transition-colors hover:text-white">GitHub</a>
        </nav>
      </div>
      <div class="flex flex-col items-start justify-between gap-2 border-t border-white/10 py-5 font-mono text-label-sm text-lab-on-dark-muted sm:flex-row sm:items-center">
        <p>© {{ new Date().getFullYear() }} 李柏偉 (Elio Lee)</p>
        <p>Taipei, Taiwan · Digital Space</p>
      </div>
    </div>
  </footer>
</template>
