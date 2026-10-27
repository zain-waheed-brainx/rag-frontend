import { useCallback, useEffect, useRef, useState } from 'react'
import { askStream } from '@/features/chat/api/chatApi'
import type { ChatMessage, HistoryMessage } from '@/features/chat/types'

// Must stay within the backend's history limits (8 messages, 2000 chars each).
const MAX_HISTORY_MESSAGES = 8
const MAX_HISTORY_CONTENT = 2000

// Old "[1]" markers point at a previous turn's context, not the new one.
function stripCitations(text: string): string {
  return text.replace(/\s*\[\d+\]/g, '').trim()
}

function toHistory(messages: ChatMessage[]): HistoryMessage[] {
  return messages
    .map(({ role, content }) => ({
      role,
      content: role === 'assistant' ? stripCitations(content) : content,
    }))
    .filter((m) => m.content.trim().length > 0)
    .slice(-MAX_HISTORY_MESSAGES)
    .map(({ role, content }) => ({ role, content: content.slice(0, MAX_HISTORY_CONTENT) }))
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const messagesRef = useRef<ChatMessage[]>([])
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const send = useCallback(async (question: string, documentId?: string) => {
    if (abortRef.current) return

    const history = toHistory(messagesRef.current)

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
    }
    setMessages((prev) => [...prev, userMessage])
    setIsSending(true)
    setError(null)

    const assistantId = crypto.randomUUID()
    setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '' }])

    const controller = new AbortController()
    abortRef.current = controller

    try {
      for await (const event of askStream({ question, documentId, history }, controller.signal)) {
        if (event.type === 'sources') {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, sources: event.sources } : m)),
          )
        } else if (event.type === 'token') {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + event.content } : m,
            ),
          )
        } else if (event.type === 'error') {
          throw new Error(event.message)
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // User stopped the stream — drop the bubble if nothing streamed in yet,
        // otherwise keep whatever partial content arrived.
        setMessages((prev) =>
          prev.filter((m) => m.id !== assistantId || m.content.length > 0),
        )
      } else {
        // Keep any partial content that streamed in before the failure.
        setError(err instanceof Error ? err : new Error('Failed to send message'))
      }
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
        setIsSending(false)
      }
    }
  }, [])

  const stop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const clear = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setIsSending(false)
    setMessages([])
    setError(null)
  }, [])

  return { messages, isSending, error, send, stop, clear }
}
