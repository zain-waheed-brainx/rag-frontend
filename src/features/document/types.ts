export interface DocumentSummary {
  documentId: string
  name: string
  chunkCount: number
}

export type UploadDocumentResult = DocumentSummary
