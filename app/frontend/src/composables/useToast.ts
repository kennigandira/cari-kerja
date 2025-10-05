import { useToastStore } from '../stores/toast'
import type { ToastOptions } from '../types/toast'

export function useToast() {
  const store = useToastStore()

  return {
    toast: (message: string, options?: ToastOptions) => store.add(message, options),
    success: (message: string, options?: Omit<ToastOptions, 'type'>) => store.success(message, options),
    error: (message: string, options?: Omit<ToastOptions, 'type'>) => store.error(message, options),
    warning: (message: string, options?: Omit<ToastOptions, 'type'>) => store.warning(message, options),
    info: (message: string, options?: Omit<ToastOptions, 'type'>) => store.info(message, options),
    clear: () => store.clear(),
  }
}
