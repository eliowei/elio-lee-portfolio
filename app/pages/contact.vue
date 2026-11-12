<script setup lang="ts">
import { site } from '~/data/site'

const { t, tm, rt } = useI18n()
const { contact } = useData()
const title = `${t('contact.title')} | Elio Lee`
const description = contact.body
const config = useRuntimeConfig().public

useSeoMeta({ title, description, ogTitle: title, ogDescription: description, ogType: 'website', ogUrl: usePageUrl() })

const topics = (tm('contact.topics') as string[]).map(m => rt(m))
// Stable, language-independent topic keys for analytics (the labels themselves are translated).
const topicKey = (label: string) => ['job', 'tech', 'correction', 'other'][topics.indexOf(label)] ?? 'other'
const info = (tm('contact.info') as Record<'icon' | 'title' | 'body', string>[]).map(i => ({ icon: rt(i.icon), title: rt(i.title), body: rt(i.body) }))
const localePath = useLocalePath()
const { track } = useAnalytics()
// Social cards after Email and GitHub; one with no URL in data/site.ts is simply not shown.
const socials = ([
  { key: 'instagram', name: 'Instagram', href: site.instagram },
  { key: 'threads', name: 'Threads', href: site.threads },
] as const).filter(s => s.href)
const email = { name: 'Email', body: t('contact.emailBody'), tag: t('contact.emailTag') }
const links = [
  { key: 'github', name: 'GitHub', href: site.github, body: t('contact.githubBody') },
  ...socials.map(c => ({ ...c, body: t(`contact.${c.key}Body`) })),
]

// The form lives in a native <dialog>: focus trap, Esc and focus return come from the browser. No address is
// printed on the page; messages go through EmailJS.
const dialog = ref<HTMLDialogElement>()
const openForm = () => {
  track('contact_form_open')
  dialog.value?.showModal()
}
const closeForm = () => dialog.value?.close()
const onCancel = (e: Event) => { if (sending.value) e.preventDefault() } // Esc must not interrupt a send
const onBackdrop = (e: MouseEvent) => { if (e.target === dialog.value && !sending.value) closeForm() }

const blank = () => ({ name: '', email: '', topic: topics[0]!, message: '' })
const form = reactive(blank())
const trap = ref('') // honeypot: hidden from people, bots fill it in
const sending = ref(false)

const rules = {
  name: (v: string) => (v ? '' : t('contact.errName')),
  email: (v: string) => (!v ? t('contact.errEmail') : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : t('contact.errEmailFormat')),
  message: (v: string) => (!v ? t('contact.errMessage') : v.length < 10 ? t('contact.errMessageShort') : ''),
}
type Field = keyof typeof rules
const errors = reactive<Record<Field, string>>({ name: '', email: '', message: '' })
const check = (k: Field) => (errors[k] = rules[k](form[k].trim()))

const toast = ref<{ ok: boolean; title: string; body: string } | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | undefined
function showToast(next: NonNullable<typeof toast.value>) {
  clearTimeout(toastTimer)
  toast.value = next
  if (next.ok) toastTimer = setTimeout(() => (toast.value = null), 6000)
}
onBeforeUnmount(() => clearTimeout(toastTimer))

const success = { ok: true, title: t('contact.okTitle'), body: t('contact.okBody') }

// EmailJS REST API, so the page needs no SDK. Template variables: {{name}} {{email}} {{topic}} {{message}}.
async function send() {
  if (sending.value) return
  const invalid = (Object.keys(rules) as Field[]).filter(check)
  if (invalid.length) return document.getElementById(`contact-${invalid[0]}`)?.focus()
  if (trap.value) {
    closeForm()
    return showToast(success)
  }

  sending.value = true
  toast.value = null
  try {
    const [res] = await Promise.all([
      fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: config.emailjs.serviceId,
          template_id: config.emailjs.templateId,
          user_id: config.emailjs.publicKey,
          template_params: { ...form },
        }),
      }),
      new Promise(r => setTimeout(r, 1600)), // long enough for one full flight of the loading plane
    ])
    if (!res.ok) throw new Error(`EmailJS ${res.status}: ${await res.text()}`)
    track('contact_submit', { topic: topicKey(form.topic) })
    Object.assign(form, blank())
    closeForm()
    showToast(success)
  } catch (e) {
    console.error(e)
    track('contact_submit_error')
    closeForm()
    showToast({ ok: false, title: t('contact.failTitle'), body: t('contact.failBody') })
  } finally {
    sending.value = false
  }
}

const label = 'mb-2 block text-label-md text-on-surface'
const field = 'w-full rounded-sm border bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface transition-colors motion-reduce:transition-none'
const fieldState = (k: Field) => (errors[k] ? 'border-error' : 'border-hairline-strong hover:border-on-surface-variant')
const hint = 'mt-2 text-body-sm text-error'
const cardArrow = 'text-[20px] text-on-surface-variant transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none'
</script>

<template>
  <div>
    <LabPageHeader :title="contact.title" :lead="contact.body" />

    <section class="section-x py-space-2xl md:py-space-3xl" aria-labelledby="contact-methods">
      <h2 id="contact-methods" class="text-headline-md">{{ $t('contact.methods') }}</h2>
      <!-- Email is the main way in, so it is a large block of its own; the other places are plain rows. -->
      <button
        type="button"
        aria-haspopup="dialog"
        class="group mt-6 flex w-full items-end justify-between gap-6 border-y border-primary/70 py-8 text-left transition-colors hover:bg-surface-container-lowest motion-reduce:transition-none"
        @click="openForm"
      >
        <span>
          <span class="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span class="text-headline-lg-mobile md:text-headline-lg">{{ email.name }}</span>
            <span v-if="email.tag" class="rounded-sm bg-lab-signal/10 px-1.5 py-0.5 text-label-sm font-medium text-lab-signal-ink">{{ email.tag }}</span>
          </span>
          <span class="mt-2 block max-w-xl text-body-md text-on-surface-variant">{{ email.body }}</span>
        </span>
        <UiIcon name="arrow_forward" :class="[cardArrow, 'shrink-0 !text-[28px]']" />
      </button>

      <ul class="divide-y divide-hairline border-b border-hairline">
        <li v-for="c in links" :key="c.key">
          <a
            :href="c.href"
            target="_blank"
            rel="noopener noreferrer"
            class="group grid items-baseline gap-x-6 gap-y-1 py-5 sm:grid-cols-[12rem_1fr_auto]"
            @click="track('social_click', { platform: c.key, source: 'contact_page' })"
          >
            <span class="text-headline-sm">{{ c.name }}</span>
            <span class="text-body-sm text-on-surface-variant">{{ c.body }}</span>
            <UiIcon name="arrow_outward" :class="cardArrow" />
          </a>
        </li>
      </ul>

      <h2 class="mt-space-xl text-headline-md">{{ $t('contact.infoTitle') }}</h2>
      <dl class="mt-6 divide-y divide-hairline border-y border-hairline">
        <div v-for="i in info" :key="i.title" class="grid gap-1 py-4 sm:grid-cols-[12rem_1fr] sm:gap-6">
          <dt class="text-body-md font-medium text-on-surface">{{ i.title }}</dt>
          <dd class="text-body-sm text-on-surface-variant">{{ i.body }}</dd>
        </div>
      </dl>
      <NuxtLink :to="localePath('/legal/privacy')" class="mt-4 inline-flex items-center gap-1 text-body-sm font-medium text-lab-signal-ink underline-offset-4 hover:underline">
        {{ $t('contact.privacyLink') }} <UiIcon name="arrow_forward" class="text-[16px]" />
      </NuxtLink>
    </section>

    <dialog
      ref="dialog"
      class="contact-dialog m-auto w-[calc(100%-2rem)] max-w-2xl rounded-sm bg-background p-0 text-on-surface shadow-2xl"
      :aria-label="$t('contact.form')"
      @cancel="onCancel"
      @click="onBackdrop"
    >
      <div class="p-6 md:p-8">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-headline-md">{{ $t('contact.heading') }}</h2>
            <p class="mt-2 text-body-md text-on-surface-variant">{{ $t('contact.lead') }}</p>
          </div>
          <button type="button" class="shrink-0 rounded-sm p-1 text-on-surface-variant transition-colors hover:text-on-surface" :aria-label="$t('contact.closeForm')" :disabled="sending" @click="closeForm">
            <UiIcon name="close" class="text-[22px]" />
          </button>
        </div>
        <form class="mt-6 space-y-6" novalidate :aria-busy="sending" @submit.prevent="send">
          <div class="grid gap-6 sm:grid-cols-2">
            <div>
              <label for="contact-name" :class="label">{{ $t('contact.name') }} <span class="text-error" aria-hidden="true">*</span></label>
              <input
                id="contact-name" v-model.trim="form.name" :class="[field, fieldState('name')]" type="text" name="name" autocomplete="name" maxlength="100"
                aria-required="true" :aria-invalid="errors.name ? 'true' : undefined" :aria-describedby="errors.name ? 'contact-name-error' : undefined"
                @blur="check('name')" @input="errors.name && check('name')"
              >
              <p v-if="errors.name" id="contact-name-error" :class="hint">{{ errors.name }}</p>
            </div>
            <div>
              <label for="contact-email" :class="label">Email <span class="text-error" aria-hidden="true">*</span></label>
              <input
                id="contact-email" v-model.trim="form.email" :class="[field, fieldState('email')]" type="email" name="email" autocomplete="email" maxlength="200"
                aria-required="true" :aria-invalid="errors.email ? 'true' : undefined" :aria-describedby="errors.email ? 'contact-email-error' : undefined"
                @blur="check('email')" @input="errors.email && check('email')"
              >
              <p v-if="errors.email" id="contact-email-error" :class="hint">{{ errors.email }}</p>
            </div>
          </div>

          <div>
            <label for="contact-topic" :class="label">{{ $t('contact.topic') }}</label>
            <select id="contact-topic" v-model="form.topic" :class="[field, 'border-hairline-strong hover:border-on-surface-variant']" name="topic">
              <option v-for="t in topics" :key="t">{{ t }}</option>
            </select>
          </div>

          <div>
            <label for="contact-message" :class="label">{{ $t('contact.message') }} <span class="text-error" aria-hidden="true">*</span></label>
            <textarea
              id="contact-message" v-model.trim="form.message" :class="[field, fieldState('message')]" name="message" rows="7" maxlength="3000"
              aria-required="true" :aria-invalid="errors.message ? 'true' : undefined" :aria-describedby="errors.message ? 'contact-message-error' : undefined"
              @blur="check('message')" @input="errors.message && check('message')"
            />
            <p v-if="errors.message" id="contact-message-error" :class="hint">{{ errors.message }}</p>
          </div>

          <div class="sr-only" aria-hidden="true">
            <label for="contact-website">Website</label>
            <input id="contact-website" v-model="trap" type="text" name="website" tabindex="-1" autocomplete="off">
          </div>

          <button
            type="submit"
            :disabled="sending"
            class="inline-flex items-center justify-center gap-2 rounded bg-lab-signal px-6 py-3 text-body-md font-medium text-lab-bg transition-colors hover:bg-lab-bg hover:text-white disabled:cursor-wait motion-reduce:transition-none"
          >
            {{ sending ? $t('contact.sending') : $t('contact.submit') }} <UiIcon name="send" class="text-[18px]" />
          </button>
        </form>
      </div>

      <!-- Loading: covers the whole page while a paper plane flies along the dashed arc into the mailbox. -->
      <Transition name="veil">
        <div v-if="sending" class="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-5 bg-lab-bg/90 backdrop-blur-sm" aria-hidden="true">
          <div class="plane-flight">
            <svg viewBox="0 0 256 112" fill="none"><path d="M12 88Q110-6 218 74" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 7" stroke-linecap="round" /></svg>
            <span class="plane"><UiIcon name="send" /></span>
            <span class="mailbox"><UiIcon name="markunread_mailbox" /></span>
          </div>
          <p class="text-label-md text-lab-on-dark-muted">{{ $t('contact.sending') }}</p>
        </div>
      </Transition>
    </dialog>

    <div class="fixed bottom-24 right-4 z-[60] w-[calc(100%-2rem)] max-w-sm md:right-8" role="status">
      <Transition name="toast">
        <div v-if="toast" class="lab-dark flex items-start gap-3 rounded-sm border border-white/15 p-4 shadow-lg">
          <UiIcon :name="toast.ok ? 'check_circle' : 'error'" class="mt-0.5 text-[22px] text-lab-signal" />
          <div class="min-w-0 flex-1">
            <p class="font-medium text-white">{{ toast.title }}</p>
            <p class="lab-muted mt-0.5 text-body-sm">{{ toast.body }}</p>
          </div>
          <button type="button" class="text-lab-on-dark-muted transition-colors hover:text-white" :aria-label="$t('contact.closeToast')" @click="toast = null">
            <UiIcon name="close" class="text-[20px]" />
          </button>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.plane-flight {
  position: relative;
  width: 256px;
  height: 112px;
  color: rgb(255 255 255 / 0.25);
}
.plane {
  position: absolute;
  left: 0;
  top: 0;
  color: theme('colors.lab.signal');
  font-size: 30px;
  line-height: 1;
  offset-path: path('M12 88Q110-6 218 74');
  offset-rotate: auto;
  animation: plane-fly 1.6s ease-in-out infinite;
}
.mailbox {
  position: absolute;
  right: 0;
  bottom: 0;
  color: #fff;
  font-size: 48px;
  line-height: 1;
  animation: mailbox-catch 1.6s ease-in-out infinite;
}
@keyframes plane-fly {
  0% { offset-distance: 0%; opacity: 0; transform: scale(0.8); }
  12% { opacity: 1; transform: scale(1); }
  82% { opacity: 1; transform: scale(1); }
  100% { offset-distance: 100%; opacity: 0; transform: scale(0.5); }
}
@keyframes mailbox-catch {
  0%, 84%, 100% { transform: scale(1); color: #fff; }
  92% { transform: scale(1.14); color: theme('colors.lab.signal'); }
}

/* Dialog enter / leave: pure CSS. `allow-discrete` keeps the dialog in the top layer until the leave transition
   ends; `@starting-style` gives the enter transition its first frame. Browsers without them just open / close. */
.contact-dialog {
  opacity: 0;
  transform: translateY(1rem) scale(0.98);
  transition: opacity 0.22s ease, transform 0.22s cubic-bezier(0.2, 0.7, 0.2, 1), overlay 0.22s allow-discrete, display 0.22s allow-discrete;
}
.contact-dialog[open] { opacity: 1; transform: none; }
.contact-dialog::backdrop {
  background: rgb(12 13 15 / 0);
  backdrop-filter: blur(0);
  transition: background-color 0.22s ease, backdrop-filter 0.22s ease, overlay 0.22s allow-discrete, display 0.22s allow-discrete;
}
.contact-dialog[open]::backdrop { background: rgb(12 13 15 / 0.6); backdrop-filter: blur(2px); }
@starting-style {
  .contact-dialog[open] { opacity: 0; transform: translateY(1rem) scale(0.98); }
  .contact-dialog[open]::backdrop { background: rgb(12 13 15 / 0); backdrop-filter: blur(0); }
}
.veil-enter-active, .veil-leave-active { transition: opacity 0.2s ease; }
.veil-enter-from, .veil-leave-to { opacity: 0; }
.toast-enter-active, .toast-leave-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(0.75rem); }

@media (prefers-reduced-motion: reduce) {
  .plane { offset-distance: 50%; animation: none; }
  .mailbox { animation: none; }
  .veil-enter-active, .veil-leave-active, .toast-enter-active, .toast-leave-active { transition: none; }
  .contact-dialog, .contact-dialog::backdrop { transition: none; }
}
</style>
