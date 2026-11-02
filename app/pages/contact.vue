<script setup lang="ts">
import { contact } from '~/data/home'

const title = '聯絡 | Elio Lee'
const description = contact.body
const config = useRuntimeConfig().public
const url = `${config.siteUrl}/contact`

useSeoMeta({ title, description, ogTitle: title, ogDescription: description, ogType: 'website', ogUrl: url })
useHead({ link: [{ rel: 'canonical', href: url }] })

const topics = ['工作機會', '技術交流', '其他']
const blank = () => ({ name: '', email: '', topic: topics[0]!, message: '' })
const form = reactive(blank())
const trap = ref('') // honeypot: hidden from people, bots fill it in
const sending = ref(false)

const rules = {
  name: (v: string) => (v ? '' : '請輸入姓名'),
  email: (v: string) => (!v ? '請輸入 Email' : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Email 格式不正確'),
  message: (v: string) => (!v ? '請輸入訊息內容' : v.length < 10 ? '訊息內容至少需要 10 個字' : ''),
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

const success = { ok: true, title: '送出成功', body: '我會盡快與您聯繫' }

// EmailJS REST API, so the page needs no SDK. Template variables: {{name}} {{email}} {{topic}} {{message}}.
async function send() {
  if (sending.value) return
  const invalid = (Object.keys(rules) as Field[]).filter(check)
  if (invalid.length) return document.getElementById(`contact-${invalid[0]}`)?.focus()
  if (trap.value) return showToast(success)

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
    Object.assign(form, blank())
    showToast(success)
  } catch (e) {
    console.error(e)
    showToast({ ok: false, title: '送出失敗', body: '訊息內容還保留著，請稍後再試一次' })
  } finally {
    sending.value = false
  }
}

const label = 'mb-2 block font-mono text-label-md text-on-surface'
const field = 'w-full rounded-sm border bg-white px-4 py-3 text-body-md text-on-surface transition-colors motion-reduce:transition-none'
const fieldState = (k: Field) => (errors[k] ? 'border-error' : 'border-hairline-strong hover:border-on-surface-variant')
const hint = 'mt-2 text-body-sm text-error'
</script>

<template>
  <div>
    <LabPageHeader :eyebrow="contact.eyebrow" :title="contact.title" :lead="contact.body" />

    <section class="section-x py-space-2xl md:py-space-3xl" aria-label="聯絡表單">
      <div class="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div class="lg:col-span-4">
          <h2 class="text-headline-md">留下訊息</h2>
          <p class="mt-3 text-body-md text-on-surface-variant">無論是工作機會或技術交流，都歡迎留下訊息，我會透過 Email 與你聯繫。</p>
        </div>

        <form class="space-y-6 lg:col-span-8" novalidate :aria-busy="sending" @submit.prevent="send">
          <div class="grid gap-6 sm:grid-cols-2">
            <div>
              <label for="contact-name" :class="label">姓名 <span class="text-error" aria-hidden="true">*</span></label>
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
            <label for="contact-topic" :class="label">聯絡類型</label>
            <select id="contact-topic" v-model="form.topic" :class="[field, 'border-hairline-strong hover:border-on-surface-variant']" name="topic">
              <option v-for="t in topics" :key="t">{{ t }}</option>
            </select>
          </div>

          <div>
            <label for="contact-message" :class="label">訊息內容 <span class="text-error" aria-hidden="true">*</span></label>
            <textarea
              id="contact-message" v-model.trim="form.message" :class="[field, fieldState('message')]" name="message" rows="7" maxlength="3000"
              aria-required="true" :aria-invalid="errors.message ? 'true' : undefined" :aria-describedby="errors.message ? 'contact-message-error' : undefined"
              @blur="check('message')" @input="errors.message && check('message')"
            />
            <p v-if="errors.message" id="contact-message-error" :class="hint">{{ errors.message }}</p>
          </div>

          <div class="absolute -left-[9999px]" aria-hidden="true">
            <label for="contact-website">Website</label>
            <input id="contact-website" v-model="trap" type="text" name="website" tabindex="-1" autocomplete="off">
          </div>

          <button
            type="submit"
            :disabled="sending"
            class="inline-flex items-center justify-center gap-2 rounded bg-lab-signal px-6 py-3 text-body-md font-medium text-lab-bg transition-colors hover:bg-lab-bg hover:text-white disabled:cursor-wait motion-reduce:transition-none"
          >
            {{ sending ? '傳送中…' : '送出訊息' }} <UiIcon name="send" class="text-[18px]" />
          </button>
        </form>
      </div>
    </section>

    <!-- Loading: covers the whole page while a paper plane flies along the dashed arc into the mailbox. -->
    <Transition name="veil">
      <div v-if="sending" class="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-5 bg-lab-bg/90 backdrop-blur-sm" aria-hidden="true">
        <div class="plane-flight">
          <svg viewBox="0 0 256 112" fill="none"><path d="M12 88Q110-6 218 74" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 7" stroke-linecap="round" /></svg>
          <span class="plane"><UiIcon name="send" /></span>
          <span class="mailbox"><UiIcon name="markunread_mailbox" /></span>
        </div>
        <p class="font-mono text-label-md text-lab-on-dark-muted">傳送中…</p>
      </div>
    </Transition>

    <div class="fixed bottom-24 right-4 z-[60] w-[calc(100%-2rem)] max-w-sm md:right-8" role="status">
      <Transition name="toast">
        <div v-if="toast" class="lab-dark flex items-start gap-3 rounded-sm border border-white/15 p-4 shadow-lg">
          <UiIcon :name="toast.ok ? 'check_circle' : 'error'" class="mt-0.5 text-[22px] text-lab-signal" />
          <div class="min-w-0 flex-1">
            <p class="font-medium text-white">{{ toast.title }}</p>
            <p class="lab-muted mt-0.5 text-body-sm">{{ toast.body }}</p>
          </div>
          <button type="button" class="text-lab-on-dark-muted transition-colors hover:text-white" aria-label="關閉通知" @click="toast = null">
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

.veil-enter-active, .veil-leave-active { transition: opacity 0.2s ease; }
.veil-enter-from, .veil-leave-to { opacity: 0; }
.toast-enter-active, .toast-leave-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(0.75rem); }

@media (prefers-reduced-motion: reduce) {
  .plane { offset-distance: 50%; animation: none; }
  .mailbox { animation: none; }
  .veil-enter-active, .veil-leave-active, .toast-enter-active, .toast-leave-active { transition: none; }
}
</style>
