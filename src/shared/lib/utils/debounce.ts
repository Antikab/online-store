export function debounce<T extends (...args: any[]) => void>(fn: T, wait = 200) {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return function debounced(this: ThisParameterType<T>, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      fn.apply(this, args)
    }, wait)
  }
}
