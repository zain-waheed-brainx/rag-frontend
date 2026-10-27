import { useState } from 'react'
import type { useDocuments } from '@/features/document/hooks/useDocuments'
import type { DocumentSummary } from '@/features/document/types'

interface DocumentListProps {
  documents: ReturnType<typeof useDocuments>
}

export function DocumentList({ documents: documentsState }: DocumentListProps) {
  const {
    documents,
    isLoading,
    error,
    uploadError,
    isUploading,
    actionError,
    upload,
    addText,
    rename,
    remove,
  } = documentsState
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [showTextForm, setShowTextForm] = useState(false)
  const [textName, setTextName] = useState('')
  const [textBody, setTextBody] = useState('')

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    await upload(file)
  }

  const handleTextSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (await addText(textName, textBody)) {
      setTextName('')
      setTextBody('')
      setShowTextForm(false)
    }
  }

  const handleDelete = (document: DocumentSummary) => {
    if (window.confirm(`Delete "${document.name}"? This cannot be undone.`)) {
      remove(document.documentId)
    }
  }

  const startEditing = (document: DocumentSummary) => {
    setEditingId(document.documentId)
    setEditingName(document.name)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditingName('')
  }

  const saveEditing = async (documentId: string) => {
    const trimmed = editingName.trim()
    if (trimmed) {
      await rename(documentId, trimmed)
    }
    cancelEditing()
  }

  return (
    <div className="document-list">
      <label className="btn btn-primary upload-button">
        Upload document
        <input
          type="file"
          accept="application/pdf,.pdf"
          onChange={handleFileChange}
          className="file-input"
          disabled={isUploading}
        />
      </label>
      <button
        type="button"
        className="btn upload-button"
        onClick={() => setShowTextForm((v) => !v)}
        disabled={isUploading}
      >
        {showTextForm ? 'Cancel' : 'Add text'}
      </button>

      {showTextForm && (
        <form className="text-form" onSubmit={handleTextSubmit}>
          <input
            className="doc-edit-input"
            placeholder="Document name"
            value={textName}
            maxLength={200}
            onChange={(event) => setTextName(event.target.value)}
            disabled={isUploading}
          />
          <textarea
            className="text-form-body"
            placeholder="Paste or type text to index…"
            rows={8}
            value={textBody}
            onChange={(event) => setTextBody(event.target.value)}
            disabled={isUploading}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isUploading || !textName.trim() || !textBody.trim()}
          >
            Save text
          </button>
        </form>
      )}

      {isLoading && <p className="chat-status">Loading documents…</p>}
      {isUploading && <p className="chat-status">Uploading and indexing…</p>}
      {error && (
        <p role="alert" className="chat-alert">
          Failed to load documents: {error.message}
        </p>
      )}
      {uploadError && (
        <p role="alert" className="chat-alert">
          Failed to upload document: {uploadError.message}
        </p>
      )}
      {actionError && (
        <p role="alert" className="chat-alert">
          {actionError.message}
        </p>
      )}
      {!isLoading && !error && documents.length === 0 && (
        <p className="message-empty">No documents yet.</p>
      )}

      <ul className="doc-list">
        {documents.map((document) => (
          <li key={document.documentId} className="doc-item">
            {editingId === document.documentId ? (
              <div className="doc-edit">
                <input
                  className="doc-edit-input"
                  value={editingName}
                  onChange={(event) => setEditingName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') saveEditing(document.documentId)
                    if (event.key === 'Escape') cancelEditing()
                  }}
                  autoFocus
                />
                <button type="button" className="btn btn-primary" onClick={() => saveEditing(document.documentId)}>
                  Save
                </button>
                <button type="button" className="btn" onClick={cancelEditing}>
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <div className="doc-info">
                  <span className="doc-name">{document.name}</span>
                  <span className="doc-chunks">{document.chunkCount} chunks</span>
                </div>
                <div className="doc-actions">
                  <button type="button" className="btn" onClick={() => startEditing(document)}>
                    Rename
                  </button>
                  <button type="button" className="btn btn-danger" onClick={() => handleDelete(document)}>
                    Delete
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
