import { apiFetch, ApiError, NETWORK_ERROR_MESSAGE, errorFromResponse } from '@/lib/api'
import { API_URL } from '@/lib/config'
import type { AskRequest, AskResponse, ChatSource } from '@/features/chat/types'

export function ask(request: AskRequest): Promise<AskResponse> {
  return apiFetch<AskResponse>('/ask', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export type AskStreamEvent =
  | { type: 'sources'; sources: ChatSource[] }
  | { type: 'token'; content: string }
  | { type: 'done' }
  | { type: 'error'; message: string }

const EVENT_TYPES = new Set<string>(['sources', 'token', 'done', 'error'])

function parseSseEvent(chunk: string): AskStreamEvent | undefined {
  const line = chunk.split(/\r\n|\n/).find((l) => l.startsWith('data: '))
  if (!line) return undefined
  try {
    const parsed: unknown = JSON.parse(line.slice('data: '.length))
    const type = (parsed as { type?: unknown } | null)?.type
    if (typeof type === 'string' && EVENT_TYPES.has(type)) return parsed as AskStreamEvent
    console.warn('Ignoring SSE event with unknown type:', parsed)
  } catch (err) {
    console.warn('Ignoring malformed SSE event:', line, err)
  }
  return undefined
}

export async function* askStream(
  request: AskRequest,
  signal?: AbortSignal,
): AsyncGenerator<AskStreamEvent> {
  let response: Response
  try {
    response = await fetch(`${API_URL}/ask/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal,
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new ApiError(NETWORK_ERROR_MESSAGE)
  }

  if (!response.ok) throw await errorFromResponse(response)
  if (!response.body) throw new ApiError('The server returned an empty response.')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      if (signal?.aborted) break
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      const chunks = buffer.split(/\r\n\r\n|\n\n/)
      buffer = chunks.pop() ?? ''

      for (const chunk of chunks) {
        const event = parseSseEvent(chunk)
        if (event) yield event
      }
    }

    buffer += decoder.decode()
    const event = parseSseEvent(buffer)
    if (event) yield event
  } finally {
    reader.releaseLock()
  }
}
