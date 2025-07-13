export function getChatId(userId1: string, userId2: string): string {
  // Sort the IDs to ensure consistent chat ID regardless of who initiates
  const sortedIds = [userId1, userId2].sort()
  return sortedIds.join("_")
}
