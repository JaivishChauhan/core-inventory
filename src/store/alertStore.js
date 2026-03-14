import { create } from 'zustand'

function createToastId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

const useAlertStore = create((set) => ({
  lowStock: [],
  toasts: [],
  setLowStock: (items) => set({ lowStock: items || [] }),
  addToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          id: toast.id || createToastId(),
          type: toast.type || 'info',
          title: toast.title || 'Notification',
          message: toast.message || '',
        },
      ],
    })),
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}))

export default useAlertStore
