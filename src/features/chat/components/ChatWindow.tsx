import { useCallback, useEffect, useRef, useState } from 'react'
import { MessageItem } from '@/features/chat/components/MessageItem'
import { useChat } from '@/features/chat/hooks/useChat'
import { useSpeechRecognition } from '@/features/chat/hooks/useSpeechRecognition'

interface ChatDocument {
  documentId: string
  name: string
}

const MAX_QUESTION_LENGTH = 500

interface ChatWindowProps {
  documents: ChatDocument[]
  documentsLoading: boolean
}

export function ChatWindow({ documents, documentsLoading }: ChatWindowProps) {
  const { messages, isSending, error, send, stop, clear } = useChat()
  const [input, setInput] = useState('')
  const [documentId, setDocumentId] = useState('')
  const [noDocumentsError, setNoDocumentsError] = useState(false)
  const bottomRef = useRef<HTMLLIElement>(null)

  const appendTranscript = useCallback((text: string) => {
    if (!text) return
    setInput((prev) => `${prev}${prev && !prev.endsWith(' ') ? ' ' : ''}${text}`.slice(0, MAX_QUESTION_LENGTH))
  }, [])
  const voice = useSpeechRecognition(appendTranscript)
  const abortVoice = voice.abort

  useEffect(() => {
    if (isSending) abortVoice()
  }, [isSending, abortVoice])

  useEffect(() => {
    if (typeof bottomRef.current?.scrollIntoView === 'function') {
      bottomRef.current.scrollIntoView({ block: 'end' })
    }
  }, [messages])

  const selectedDocumentId =
    documentsLoading || documents.some((document) => document.documentId === documentId)
      ? documentId
      : ''

  const trimmed = input.trim()
  const canSend = trimmed.length > 0 && trimmed.length <= MAX_QUESTION_LENGTH && !isSending

  const submit = () => {
    if (!canSend) return
    if (!documentsLoading && documents.length === 0) {
      setNoDocumentsError(true)
      return
    }
    setNoDocumentsError(false)
    voice.abort()
    send(trimmed, selectedDocumentId || undefined)
    setInput('')
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    submit()
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <div className="chat-window">
      {messages.length > 0 && (
        <div className="chat-header">
          <button type="button" className="btn btn-secondary" onClick={clear}>
            Clear
          </button>
        </div>
      )}
      <ul className="message-list" aria-live="polite">
        {messages.length === 0 && (
          <li className="message-empty">Ask a question to get started.</li>
        )}
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
        <li ref={bottomRef} aria-hidden="true" />
      </ul>
      {isSending && (
        <p role="status" className="chat-status">
          Thinking…
        </p>
      )}
      {noDocumentsError && documents.length === 0 && (
        <p role="alert" className="chat-alert">
          No documents available. Please add a document to start chatting.
        </p>
      )}
      {error && (
        <p role="alert" className="chat-alert">
          {error.message}
        </p>
      )}
      {voice.error && (
        <p role="alert" className="chat-alert">
          {voice.error}
        </p>
      )}
      <form onSubmit={handleSubmit} className="chat-form">
        <label className="scope-select">
          <span>Search in</span>
          <select value={selectedDocumentId} onChange={(event) => setDocumentId(event.target.value)}>
            <option value="">All documents</option>
            {documents.map((document) => (
              <option key={document.documentId} value={document.documentId}>
                {document.name}
              </option>
            ))}
          </select>
        </label>
        <textarea
          className="chat-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={MAX_QUESTION_LENGTH}
          rows={2}
          placeholder="Ask a question… (Enter to send, Shift+Enter for a new line)"
          disabled={isSending}
        />
        {voice.isListening && voice.interim && (
          <p className="voice-interim" aria-hidden="true">
            {voice.interim}
          </p>
        )}
        <div className="chat-form-footer">
          <span className="char-counter">
            {input.length}/{MAX_QUESTION_LENGTH}
          </span>
          {voice.isSupported && (
            <button
              type="button"
              className={`btn btn-secondary voice-btn${voice.isListening ? ' listening' : ''}`}
              onClick={voice.isListening ? voice.stop : voice.start}
              disabled={isSending}
              aria-pressed={voice.isListening}
              aria-label={voice.isListening ? 'Stop voice input' : 'Start voice input'}
            >
              {voice.isListening ? '⏹ Listening…' : '🎤 Voice'}
            </button>
          )}
          {isSending ? (
            <button type="button" className="btn btn-secondary" onClick={stop}>
              Stop
            </button>
          ) : (
            <button type="submit" className="btn btn-primary" disabled={!canSend}>
              Send
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
