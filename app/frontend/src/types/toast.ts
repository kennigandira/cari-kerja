export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number // ms, undefined = manual dismiss only
  dismissible?: boolean
}

export interface ToastOptions {
  type?: ToastType
  duration?: number
  dismissible?: boolean
}
