import { ref, onMounted, onBeforeUnmount, type Ref } from 'vue'

export function useElementSize(target: Ref<HTMLElement | null>) {
  const width = ref(0)
  const height = ref(0)

  let observer: ResizeObserver | null = null

  function update(entry: ResizeObserverEntry) {
    width.value = entry.contentRect.width
    height.value = entry.contentRect.height
  }

  onMounted(() => {
    if (!target.value) return

    observer = new ResizeObserver((entries) => {
      for (const entry of entries) update(entry)
    })
    observer.observe(target.value)
    update({ contentRect: target.value.getBoundingClientRect() } as ResizeObserverEntry)
  })

  onBeforeUnmount(() => {
    if (observer && target.value) observer.unobserve(target.value)
    observer?.disconnect()
    observer = null
  })

  return { width, height }
}
