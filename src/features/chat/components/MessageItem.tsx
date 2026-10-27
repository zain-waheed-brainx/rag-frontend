import { SourceList } from '@/features/chat/components/SourceList'
import type { ChatMessage } from '@/features/chat/types'

interface MessageItemProps {
  message: ChatMessage
}

export function MessageItem({ message }: MessageItemProps) {
  return (
    <li className={`message message-${message.role}`}>
      <div className="message-bubble">
        <span className="message-role">{message.role === 'user' ? 'You' : 'Assistant'}</span>
        <p className="message-content">{message.content}</p>
        {message.sources && <SourceList sources={message.sources} />}
      </div>
    </li>
  )
}
