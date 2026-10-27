import { apiFetch } from '@/lib/api'
import type { DocumentSummary, UploadDocumentResult } from '@/features/document/types'

export function listDocuments(): Promise<DocumentSummary[]> {
  return apiFetch<DocumentSummary[]>('/documents')
}

export function uploadDocument(file: File, name?: string): Promise<UploadDocumentResult> {
  const formData = new FormData()
  formData.append('file', file)
  if (name) formData.append('name', name)

  return apiFetch<UploadDocumentResult>('/documents/upload', {
    method: 'POST',
    body: formData,
  })
}

export function createTextDocument(name: string, text: string): Promise<UploadDocumentResult> {
  return apiFetch<UploadDocumentResult>('/documents', {
    method: 'POST',
    body: JSON.stringify({ name, text }),
  })
}

export function renameDocument(documentId: string, name: string): Promise<void> {
  return apiFetch<void>(`/documents/${documentId}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  })
}

export function deleteDocument(documentId: string): Promise<void> {
  return apiFetch<void>(`/documents/${documentId}`, { method: 'DELETE' })
}
