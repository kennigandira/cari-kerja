import { defineStore } from 'pinia'
import type { Toast, ToastOptions } from '../types/toast'

const DEFAULT_DURATION = 5000 // 5 seconds
const MAX_TOASTS = 3 // Prevent toast spam

export const useToastStore = defineStore('toast', {
  state: () => ({
    toasts: [] as Toast[],
  }),

  actions: {
    add(message: string, options: ToastOptions = {}) {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      const toast: Toast = {
        id,
        message,
        type: options.type ?? 'info',
        duration: options.duration ?? DEFAULT_DURATION,
        dismissible: options.dismissible ?? true,
      }

      // Stack limit enforcement (prevent UI explosion)
      if (this.toasts.length >= MAX_TOASTS) {
        this.toasts.shift() // Remove oldest
      }

      this.toasts.push(toast)
      return id
    },

    remove(id: string) {
      const index = this.toasts.findIndex(t => t.id === id)
      if (index > -1) {
        this.toasts.splice(index, 1)
      }
    },

    clear() {
      this.toasts = []
    },

    // Convenience methods (type-safe shortcuts)
    success(message: string, options?: Omit<ToastOptions, 'type'>) {
      return this.add(message, { ...options, type: 'success' })
    },

    error(message: string, options?: Omit<ToastOptions, 'type'>) {
      return this.add(message, { ...options, type: 'error' })
    },

    warning(message: string, options?: Omit<ToastOptions, 'type'>) {
      return this.add(message, { ...options, type: 'warning' })
    },

    info(message: string, options?: Omit<ToastOptions, 'type'>) {
      return this.add(message, { ...options, type: 'info' })
    },
  },
})
