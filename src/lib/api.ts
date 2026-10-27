import { API_URL } from '@/lib/config'

export class ApiError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const STATUS_MESSAGES: Record<number, string> = {
  400: 'That request was invalid.',
  413: 'That file is too large.',
  429: "You're sending requests too quickly — please wait a moment and try again.",
  503: 'The service is temporarily unavailable. Please try again shortly.',
}

export const NETWORK_ERROR_MESSAGE = 'Unable to reach the server. Is it running?'

async function readErrorMessage(response: Response): Promise<string | undefined> {
  try {
    const body: unknown = await response.json()
    const message = (body as { message?: unknown } | null)?.message
    if (typeof message === 'string') return message
    if (Array.isArray(message)) return message.join(', ')
  } catch {
    // Response had no JSON body — fall through to the status-based message.
  }
  return undefined
}

export async function errorFromResponse(response: Response): Promise<ApiError> {
  const serverMessage = await readErrorMessage(response)
  const fallback = STATUS_MESSAGES[response.status] ?? `Request failed (${response.status}).`
  return new ApiError(serverMessage ?? fallback, response.status)
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const isFormData = init?.body instanceof FormData

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...init?.headers,
      },
    })
  } catch {
    throw new ApiError(NETWORK_ERROR_MESSAGE)
  }

  if (!response.ok) {
    throw await errorFromResponse(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}
