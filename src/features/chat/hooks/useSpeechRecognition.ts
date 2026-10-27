import { useCallback, useEffect, useRef, useState } from 'react'

interface SpeechRecognitionAlternative {
  transcript: string
}

interface SpeechRecognitionResult {
  readonly length: number
  readonly isFinal: boolean
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionEvent {
  readonly resultIndex: number
  readonly results: ArrayLike<SpeechRecognitionResult>
}

interface SpeechRecognitionErrorEvent {
  readonly error: string
}

interface SpeechRecognitionInstance {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

const getConstructor = (): SpeechRecognitionConstructor | undefined => {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

const ERROR_MESSAGES: Record<string, string> = {
  'not-allowed': 'Microphone access was denied. Allow it in your browser settings.',
  'service-not-allowed': 'Microphone access was denied. Allow it in your browser settings.',
  'no-speech': 'No speech detected. Try again.',
  'audio-capture': 'No microphone found.',
  network: 'Voice input needs a network connection.',
}

/**
 * Wraps the browser Web Speech API. `onFinalTranscript` is called with each
 * finalized phrase; interim text is exposed via `interim` for live preview.
 */
export function useSpeechRecognition(onFinalTranscript: (text: string) => void) {
  const [isListening, setIsListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const callbackRef = useRef(onFinalTranscript)
  const isSupported = typeof window !== 'undefined' && getConstructor() !== undefined

  useEffect(() => {
    callbackRef.current = onFinalTranscript
  }, [onFinalTranscript])

  useEffect(() => () => recognitionRef.current?.abort(), [])

  const start = useCallback(() => {
    const Recognition = getConstructor()
    if (!Recognition || recognitionRef.current) return
    const recognition = new Recognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = navigator.language || 'en-US'

    recognition.onresult = (event) => {
      let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const text = result[0].transcript
        if (result.isFinal) callbackRef.current(text.trim())
        else interimText += text
      }
      setInterim(interimText)
    }
    recognition.onerror = (event) => {
      if (event.error !== 'aborted') {
        setError(ERROR_MESSAGES[event.error] ?? 'Voice input failed. Try again.')
      }
    }
    recognition.onend = () => {
      recognitionRef.current = null
      setIsListening(false)
      setInterim('')
    }

    setError(null)
    recognitionRef.current = recognition
    try {
      recognition.start()
      setIsListening(true)
    } catch {
      recognitionRef.current = null
      setError('Voice input failed. Try again.')
    }
  }, [])

  const stop = useCallback(() => recognitionRef.current?.stop(), [])

  // Unlike stop(), abort() discards any pending results instead of delivering them.
  const abort = useCallback(() => recognitionRef.current?.abort(), [])

  return { isSupported, isListening, interim, error, start, stop, abort }
}
