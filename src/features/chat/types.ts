export interface ChatSource {
  documentId: string
  name: string
  chunkIndex: number
  pageNumber?: number
  text: string
  score: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: ChatSource[]
}

export interface HistoryMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AskRequest {
  question: string
  history?: HistoryMessage[]
  documentId?: string
  topK?: number
}

export interface AskResponse {
  answer: string
  sources: ChatSource[]
}
