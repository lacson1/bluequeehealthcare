import { useState, useCallback } from 'react'

interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

interface ToastState {
  toasts: Toast[]
}

let globalToastState: ToastState = { toasts: [] }
let listeners: Array<(state: ToastState) => void> = []

function notifyListeners() {
  listeners.forEach(listener => {
    try {
      listener(globalToastState)
    } catch (error) {
      console.warn('Toast listener error:', error)
    }
  })
}

function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

export function useSimpleToast() {
  const [state, setState] = useState<ToastState>(globalToastState)

  const addListener = useCallback((listener: (state: ToastState) => void) => {
    listeners.push(listener)
    return () => {
      listeners = listeners.filter(l => l !== listener)
    }
  }, [])

  const toast = useCallback((toastData: Omit<Toast, 'id'>) => {
    const id = generateId()
    const newToast: Toast = { ...toastData, id }
    
    globalToastState = {
      toasts: [newToast, ...globalToastState.toasts].slice(0, 3) // Keep only 3 toasts max
    }
    
    notifyListeners()

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      globalToastState = {
        toasts: globalToastState.toasts.filter(t => t.id !== id)
      }
      notifyListeners()
    }, 5000)

    return {
      id,
      dismiss: () => {
        globalToastState = {
          toasts: globalToastState.toasts.filter(t => t.id !== id)
        }
        notifyListeners()
      }
    }
  }, [])

  return {
    toast,
    toasts: state.toasts,
    addListener
  }
}