import { supabase } from './supabase';

export interface Poll {
  id: string;
  contextType: 'chat' | 'feed' | 'team';
  contextId: string;
  createdBy: string;
  question: string;
  options: PollOption[];
  createdAt: string;
  expiresAt?: string;
}

export interface PollOption {
  id: string;
  pollId: string;
  text: string;
  votes: number;
  voters: string[];
}

export interface PollVote {
  pollId: string;
  optionId: string;
  userId: string;
}

export const pollService = {
  // Create a poll
  createPoll: async (data: {
    contextType: 'chat' | 'feed' | 'team';
    contextId: string;
    createdBy: string;
    question: string;
    options: string[];
    expiresAt?: string;
  }): Promise<Poll> => {
    try {
      // In production, this would create a poll in Supabase
      // For now, return mock data
      const poll: Poll = {
        id: Date.now().toString(),
        contextType: data.contextType,
        contextId: data.contextId,
        createdBy: data.createdBy,
        question: data.question,
        options: data.options.map((text, index) => ({
          id: `${Date.now()}-${index}`,
          pollId: Date.now().toString(),
          text,
          votes: 0,
          voters: [],
        })),
        createdAt: new Date().toISOString(),
        expiresAt: data.expiresAt,
      };
      return poll;
    } catch (error: any) {
      console.error('Error creating poll:', error);
      throw new Error(error.message || 'Failed to create poll');
    }
  },

  // Vote on a poll
  vote: async (pollId: string, optionId: string, userId: string): Promise<void> => {
    try {
      // In production, this would update the poll vote in Supabase
      // Mock implementation
      console.log(`User ${userId} voted for option ${optionId} in poll ${pollId}`);
    } catch (error: any) {
      console.error('Error voting on poll:', error);
      throw new Error(error.message || 'Failed to vote on poll');
    }
  },

  // Get polls for a context
  getPolls: async (
    contextType: 'chat' | 'feed' | 'team',
    contextId: string
  ): Promise<Poll[]> => {
    try {
      // In production, fetch from Supabase
      // Mock implementation
      return [];
    } catch (error: any) {
      console.error('Error fetching polls:', error);
      throw new Error(error.message || 'Failed to fetch polls');
    }
  },

  // Delete a poll
  deletePoll: async (pollId: string, userId: string): Promise<void> => {
    try {
      // In production, delete from Supabase (with permission check)
      // Mock implementation
      console.log(`Poll ${pollId} deleted by user ${userId}`);
    } catch (error: any) {
      console.error('Error deleting poll:', error);
      throw new Error(error.message || 'Failed to delete poll');
    }
  },
};

