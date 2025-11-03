import { supabase } from './supabase';

export interface RematchRequest {
  id: string;
  originalMatchId: string;
  requestedBy: string;
  requestedByNickname: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  createdAt: string;
  respondedAt?: string;
}

export const rematchService = {
  // Request a rematch
  requestRematch: async (matchId: string, userId: string, userNickname: string): Promise<RematchRequest> => {
    try {
      // In production, create rematch request in Supabase
      // Mock implementation
      const request: RematchRequest = {
        id: Date.now().toString(),
        originalMatchId: matchId,
        requestedBy: userId,
        requestedByNickname: userNickname,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      return request;
    } catch (error: any) {
      console.error('Error requesting rematch:', error);
      throw new Error(error.message || 'Failed to request rematch');
    }
  },

  // Accept a rematch request
  acceptRematch: async (requestId: string): Promise<string> => {
    try {
      // In production, create new match from rematch request
      // Mock implementation - returns new match ID
      const newMatchId = Date.now().toString();
      return newMatchId;
    } catch (error: any) {
      console.error('Error accepting rematch:', error);
      throw new Error(error.message || 'Failed to accept rematch');
    }
  },

  // Decline a rematch request
  declineRematch: async (requestId: string): Promise<void> => {
    try {
      // In production, update rematch request status to 'declined'
      // Mock implementation
      console.log(`Rematch request ${requestId} declined`);
    } catch (error: any) {
      console.error('Error declining rematch:', error);
      throw new Error(error.message || 'Failed to decline rematch');
    }
  },

  // Get rematch requests for a user
  getRematchRequests: async (userId: string): Promise<RematchRequest[]> => {
    try {
      // In production, fetch from Supabase
      // Mock implementation
      return [];
    } catch (error: any) {
      console.error('Error fetching rematch requests:', error);
      throw new Error(error.message || 'Failed to fetch rematch requests');
    }
  },
};

