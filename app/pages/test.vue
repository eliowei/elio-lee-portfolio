<template>
  <div class="flex w-full flex-col">
    test
  </div>
  <input type="text" v-model="keyword">
</template>

<script setup>
import { ref, watch } from 'vue'

const keyword = ref('')
const products = ref([])
const loading = ref(false)

let requestId = 0
let controller = null
let timer = null

const fetchData = async (value) => {

  // 1.產生的新請求
  const currentId = ++requestId

  // 2.嘗試取消前一次請求
  controller?.abort()
  controller = new AbortController()

  if (!value.trim()) {
    products.value = []
    loading.value = false
    return
  }

  loading.value = true

  try {
    // 3.發送請求
    const response = await fetch(
      `api/products?q=${encodeURIComponent(value)}`,
      { signal: controller.signal}
    )

    const result = await response.json()

    // 4.確認是否為最新請求
    if (currentId !== requestId) return

    products.value = result
  } catch (error) {
    if(error.name === 'AbortError') return
    throw error
  } finally {
    // 5.只有最新請求能關閉loading
    if (currentId === requestId) {
      loading.value = false
    }
  } 
}

watch(keyword, (value) => {
  clearTimeout(timer)

  if (!value.trim()) {
    products.value = []
    loading.value = false
    return
  }

  timer = setTimeout(() => {
    fetchData(value)
  }, 300)
})

onBeforeMount(() => {
  clearTimeout(timer)
  controller?.abort()
})

</script>