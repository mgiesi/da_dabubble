/**
 * Formats timestamp to readable time string
 */
export function formatMessageTime(timestamp: Date | null | undefined): string {
  if (!timestamp || !(timestamp instanceof Date) || isNaN(timestamp.getTime())) {
    return 'now'
  }

  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  
  // Less than 1 minute
  if (diff < 60000) {
    return 'now'
  }
  
  // Less than 1 hour - show minutes
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000)
    return `${minutes}m`
  }
  
  // Same day - show time
  if (timestamp.toDateString() === now.toDateString()) {
    return timestamp.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  // Different day - show date
  return timestamp.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit'
  })
}