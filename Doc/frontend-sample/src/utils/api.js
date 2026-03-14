export function getApiErrorMessage(error, fallback = 'Something went wrong') {
  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  )
}

export function formatDateTime(value) {
  if (!value) return '—'

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatDateOnly(value) {
  if (!value) return '—'

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
  }).format(new Date(value))
}

export function toDateInputValue(value) {
  if (!value) return ''

  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0))
}

export function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}
