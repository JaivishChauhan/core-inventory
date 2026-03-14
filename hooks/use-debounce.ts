import { useEffect, useState } from "react"

/**
 * Debounces a value by the given delay in milliseconds.
 * Use for search inputs to avoid making API calls on every keystroke.
 *
 * @param value - The value to debounce
 * @param delayMs - Milliseconds to wait after last change before returning the new value
 * @returns The debounced value, which lags behind `value` by `delayMs`
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delayMs)

    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debouncedValue
}
