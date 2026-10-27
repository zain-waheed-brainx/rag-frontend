import type { ChatSource } from '@/features/chat/types'

const SNIPPET_LENGTH = 160

interface SourceListProps {
  sources: ChatSource[]
}

export function SourceList({ sources }: SourceListProps) {
  if (sources.length === 0) return null

  return (
    <ul className="source-list">
      {sources.map((source) => {
        const snippet =
          source.text.length > SNIPPET_LENGTH
            ? `${source.text.slice(0, SNIPPET_LENGTH).trim()}…`
            : source.text

        return (
          <li key={`${source.documentId}-${source.chunkIndex}`} className="source-item">
            <div className="source-meta">
              <span className="source-name">{source.name}</span>
              {source.pageNumber !== undefined && (
                <span className="source-page"> (p.{source.pageNumber})</span>
              )}
              <span className="source-score"> · {source.score.toFixed(2)}</span>
            </div>
            <p className="source-snippet">{snippet}</p>
          </li>
        )
      })}
    </ul>
  )
}
