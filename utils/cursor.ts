/**
 * Cursor Pagination Utilities
 * Handles encoding/decoding of cursor for keyset pagination
 */

export type Cursor = string | null; // ISO timestamp ή base64 JSON

/**
 * Encode cursor object to base64 string
 */
export function encodeCursor(obj: any): string {
  try {
    return Buffer.from(JSON.stringify(obj)).toString('base64');
  } catch (error) {
    console.error('Error encoding cursor:', error);
    throw new Error('Failed to encode cursor');
  }
}

/**
 * Decode cursor string to object
 */
export function decodeCursor(str: string): any {
  try {
    return JSON.parse(Buffer.from(str, 'base64').toString('utf8'));
  } catch (error) {
    console.error('Error decoding cursor:', error);
    throw new Error('Failed to decode cursor');
  }
}

/**
 * Simple timestamp cursor (for single-field sorting)
 */
export function createTimestampCursor(timestamp: string): string {
  return encodeCursor({ timestamp });
}

/**
 * Extract timestamp from cursor
 */
export function getTimestampFromCursor(cursor: string | null): string | null {
  if (!cursor) return null;
  try {
    const decoded = decodeCursor(cursor);
    return decoded.timestamp || null;
  } catch {
    return null;
  }
}

/**
 * Complex cursor for multi-field sorting (e.g., distance + id)
 */
export function createComplexCursor(fields: Record<string, any>): string {
  return encodeCursor(fields);
}

/**
 * Extract complex cursor fields
 */
export function getFieldsFromCursor(cursor: string | null): Record<string, any> | null {
  if (!cursor) return null;
  try {
    return decodeCursor(cursor);
  } catch {
    return null;
  }
}

/**
 * Create match cursor (match_date + match_id)
 */
export function createMatchCursor(matchDate: string, matchId: string): string {
  return encodeCursor({ match_date: matchDate, match_id: matchId });
}

/**
 * Extract match cursor fields (match_date + match_id)
 */
export function getMatchCursorFields(cursor: string | null): { match_date: string; match_id: string } | null {
  if (!cursor) return null;
  try {
    const decoded = decodeCursor(cursor);
    return {
      match_date: decoded.match_date || decoded.matchDate,
      match_id: decoded.match_id || decoded.matchId,
    };
  } catch {
    return null;
  }
}

/**
 * Create chat message cursor (created_at + id)
 */
export function createChatMessageCursor(createdAt: string, messageId: string): string {
  return encodeCursor({ created_at: createdAt, id: messageId });
}

/**
 * Extract chat message cursor fields (created_at + id)
 */
export function getChatMessageCursorFields(cursor: string | null): { created_at: string; id: string } | null {
  if (!cursor) return null;
  try {
    const decoded = decodeCursor(cursor);
    return {
      created_at: decoded.created_at || decoded.createdAt,
      id: decoded.id || decoded.messageId,
    };
  } catch {
    return null;
  }
}

/**
 * Create notification cursor (created_at + id)
 */
export function createNotificationCursor(createdAt: string, id: string): string {
  return encodeCursor({ created_at: createdAt, id });
}

/**
 * Extract notification cursor fields (created_at + id)
 */
export function getNotificationCursorFields(cursor: string | null): { created_at: string; id: string } | null {
  if (!cursor) return null;
  try {
    const decoded = decodeCursor(cursor);
    return {
      created_at: decoded.created_at || decoded.createdAt,
      id: decoded.id,
    };
  } catch {
    return null;
  }
}

