import { toast } from 'sonner'
import { ApiError } from './api-client'

export function handleApiError(error: unknown, defaultMessage: string = 'An error occurred') {
  console.error(defaultMessage, error)
  
  if (error instanceof ApiError) {
    if (error.status === 409) {
      let message = 'This name already exists. Please choose a different name.'
      try {
        const response = JSON.parse(error.response || '{}')
        if (response.message) {
          message = response.message
        }
      } catch {
      }
      toast.error(message)
      return
    }
    
    toast.error(error.message || defaultMessage)
    return
  }
  
  toast.error(defaultMessage)
}

export function showSuccessToast(message: string) {
  toast.success(message)
}
