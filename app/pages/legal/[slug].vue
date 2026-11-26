<script setup lang="ts">
// Privacy / terms / disclaimer / corrections: Markdown in content/{,en/,ja/}legal/, rendered in the notes' reading view.
const route = useRoute()
const { t } = useI18n()
const collection = useLegalCollection()
const { data: doc } = await useAsyncData(`legal-${route.path}`, () => queryCollection(collection).path(route.path).first())
if (!doc.value) throw createError({ statusCode: 404, statusMessage: t('legal.notFound'), fatal: true })

usePageSeo({ title: doc.value.title, description: doc.value.description })
</script>

<template>
  <div v-if="doc" class="section-x pb-space-xl pt-28 md:pt-32">
    <div class="mx-auto max-w-[720px]">
      <header class="space-y-3 pb-space-lg">
        <h1 class="text-headline-lg-mobile md:text-headline-lg">{{ doc.title }}</h1>
        <p class="font-mono text-label-md text-on-surface-variant">
          {{ $t('legal.updated') }}{{ $t('common.colon') }}<time :datetime="doc.updated">{{ doc.updated.replaceAll('-', '/') }}</time>
        </p>
      </header>
      <article class="border-t border-hairline pt-space-lg">
        <ContentRenderer :value="doc" class="prose-post" />
      </article>
    </div>
  </div>
</template>
