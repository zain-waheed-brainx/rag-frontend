import { HomePage } from '@/pages/HomePage'

export function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>RAG Chatbot</h1>
      </header>

      <main className="app-content">
        <HomePage />
      </main>
    </div>
  )
}
