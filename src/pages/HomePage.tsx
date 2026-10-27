import { ChatWindow } from '@/features/chat'
import { DocumentList, useDocuments } from '@/features/document'

export function HomePage() {
  const documentsState = useDocuments()

  return (
    <div className="home-layout">
      <aside className="documents-panel">
        <h2>Documents</h2>
        <DocumentList documents={documentsState} />
      </aside>

      <section className="chat-panel">
        <h2>Chat</h2>
        <ChatWindow
          documents={documentsState.documents}
          documentsLoading={documentsState.isLoading}
        />
      </section>
    </div>
  )
}
