import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createTextDocument,
  deleteDocument,
  listDocuments,
  renameDocument,
  uploadDocument,
} from '@/features/document/api/documentApi'
import type { DocumentSummary } from '@/features/document/types'

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024
const MAX_TEXT_LENGTH = 200_000 // keep in sync with the backend CreateDocumentDto

export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [uploadError, setUploadError] = useState<Error | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [actionError, setActionError] = useState<Error | null>(null)

  const requestIdRef = useRef(0)

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current
    try {
      const docs = await listDocuments()
      if (requestId !== requestIdRef.current) return
      setDocuments(docs)
      setError(null)
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setError(err instanceof Error ? err : new Error('Failed to load documents'))
    }
  }, [])

  useEffect(() => {
    let ignore = false
    listDocuments()
      .then((docs) => {
        if (ignore) return
        setDocuments(docs)
        setError(null)
      })
      .catch((err) => {
        if (ignore) return
        setError(err instanceof Error ? err : new Error('Failed to load documents'))
      })
      .finally(() => {
        if (!ignore) setIsLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [])

  const upload = useCallback(
    async (file: File, name?: string) => {
      setUploadError(null)

      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
      if (!isPdf) {
        setUploadError(new Error('Only PDF files are supported.'))
        return
      }
      if (file.size > MAX_UPLOAD_SIZE_BYTES) {
        setUploadError(new Error('File is too large. The maximum size is 10 MB.'))
        return
      }

      setIsUploading(true)
      try {
        await uploadDocument(file, name)
        await refresh()
      } catch (err) {
        setUploadError(err instanceof Error ? err : new Error('Failed to upload document'))
      } finally {
        setIsUploading(false)
      }
    },
    [refresh],
  )

  const addText = useCallback(
    async (name: string, text: string): Promise<boolean> => {
      setUploadError(null)

      const trimmedName = name.trim()
      const trimmedText = text.trim()
      if (!trimmedName || !trimmedText) {
        setUploadError(new Error('Both a name and some text are required.'))
        return false
      }
      if (trimmedText.length > MAX_TEXT_LENGTH) {
        setUploadError(new Error('Text is too long. The maximum is 200,000 characters.'))
        return false
      }

      setIsUploading(true)
      try {
        await createTextDocument(trimmedName, trimmedText)
        await refresh()
        return true
      } catch (err) {
        setUploadError(err instanceof Error ? err : new Error('Failed to add text'))
        return false
      } finally {
        setIsUploading(false)
      }
    },
    [refresh],
  )

  const rename = useCallback(
    async (documentId: string, name: string) => {
      setActionError(null)
      try {
        await renameDocument(documentId, name)
        await refresh()
      } catch (err) {
        setActionError(err instanceof Error ? err : new Error('Failed to rename document'))
      }
    },
    [refresh],
  )

  const remove = useCallback(
    async (documentId: string) => {
      setActionError(null)
      try {
        await deleteDocument(documentId)
        await refresh()
      } catch (err) {
        setActionError(err instanceof Error ? err : new Error('Failed to delete document'))
      }
    },
    [refresh],
  )

  return {
    documents,
    isLoading,
    error,
    uploadError,
    isUploading,
    actionError,
    refresh,
    upload,
    addText,
    rename,
    remove,
  }
}
