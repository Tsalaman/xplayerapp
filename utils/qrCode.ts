/**
 * QR Code Utilities
 * Generate QR codes for team invites
 */

import { encodeCursor } from './cursor';

/**
 * Generate invite link for team (supports both invite_code and invite_token)
 */
export function generateInviteLink(inviteCodeOrToken: string, baseUrl?: string): string {
  const url = baseUrl || 'sportsmatch://invite';
  return `${url}/${inviteCodeOrToken}`;
}

/**
 * Generate QR code data for team invite
 */
export function generateQRCodeData(inviteCodeOrToken: string, baseUrl?: string): string {
  return generateInviteLink(inviteCodeOrToken, baseUrl);
}

/**
 * Extract invite token from deep link (sportsmatch://invite/{token})
 */
export function extractInviteToken(link: string): string | null {
  try {
    // Try to parse as URL
    const url = new URL(link);
    
    // Handle sportsmatch://invite/{token}
    if (url.pathname && url.pathname.startsWith('/invite/')) {
      return url.pathname.split('/invite/')[1];
    }
    
    // Handle sportsmatch://invite?token={token}
    return url.searchParams.get('token');
  } catch {
    // Try simple pattern matching
    // Match: sportsmatch://invite/{token} or myapp://invite/{token}
    const match = link.match(/(?:invite\/|invite\?token=)([A-Z0-9]+)/i);
    if (match) return match[1];
    
    // Fallback: old format with code parameter
    const codeMatch = link.match(/code=([A-Z0-9]+)/);
    return codeMatch ? codeMatch[1] : null;
  }
}

