export type Sport = 'football' | 'basketball' | 'tennis' | 'padel';

export interface User {
  id: string;
  email: string;
  nickname: string;
  sports: Sport[];
  profilePicture?: string;
  bio?: string;
  location?: string;
  skillLevel?: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  latitude?: number;
  longitude?: number;
  last_location_ts?: string;
  locationPrivacy?: 'exact' | 'coarse' | 'hidden'; // Privacy setting
  [key: string]: any; // For additional custom fields
}

export interface Post {
  id: string;
  userId: string;
  userNickname: string;
  type: 'teammate' | 'opponent';
  sport: Sport;
  title: string;
  description: string;
  location?: string;
  date?: string;
  time?: string;
  createdAt: string;
  status: 'open' | 'closed';
}

export interface Tournament {
  id: string;
  title: string;
  description: string;
  sport: Sport;
  location: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  maxParticipants?: number;
  entryFee?: number;
  prize?: string;
  createdAt: string;
  isActive: boolean;
}

export interface TournamentParticipant {
  id: string;
  tournamentId: string;
  participantType: 'user' | 'team';
  userId?: string;
  teamId?: string;
  participantName: string;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentMethod?: string;
  paymentTransactionId?: string;
  paymentAmount?: number;
  paymentDate?: string;
  confirmed: boolean;
  registrationDate: string;
}

export interface TournamentResult {
  id: string;
  tournamentId: string;
  participantId: string;
  participantType: 'user' | 'team';
  position: number;
  points: number;
  wins: number;
  losses: number;
  draws: number;
  goalsFor: number;
  goalsAgainst: number;
  prize?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserStats {
  id: string;
  userId: string;
  tournamentsPlayed: number;
  tournamentsWon: number;
  tournamentsRunnerUp: number;
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
  totalGoalsFor: number;
  totalGoalsAgainst: number;
  totalPoints: number;
  updatedAt: string;
}

export interface TeamStats {
  id: string;
  teamId: string;
  tournamentsPlayed: number;
  tournamentsWon: number;
  tournamentsRunnerUp: number;
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
  totalGoalsFor: number;
  totalGoalsAgainst: number;
  totalPoints: number;
  updatedAt: string;
}

export interface Venue {
  id: string;
  name: string;
  description?: string;
  sport: Sport;
  address: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number; // Distance from user (for nearby venues)
  isPublic: boolean;
  ownerId?: string;
  ownerEmail?: string;
  phone?: string;
  website?: string;
  pricePerHour?: number;
  listingFee?: number;
  listingStatus: 'active' | 'pending' | 'expired';
  listingExpiresAt?: string;
  allowsBooking: boolean;
  bookingPricePerHour?: number;
  amenities?: string[];
  images?: string[];
  rating: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  name: string;
  sport: Sport;
  maxPlayers: number;
  ownerId: string;
  ownerNickname: string;
  isPublic: boolean;
  description?: string;
  location?: string;
  inviteCode?: string;
  createdAt: string;
  updatedAt: string;
  memberCount?: number; // Current member count
  isMember?: boolean; // Whether current user is a member
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  userNickname: string;
  role: 'owner' | 'captain' | 'player';
  joinedAt: string;
}

export interface TeamWithMembers extends Team {
  members: TeamMember[];
  memberCount: number;
}

export interface Match {
  id: string;
  userId: string;
  sport: Sport;
  matchDate: string;
  teamName?: string;
  opponentTeamName?: string;
  playerNames?: string[];
  opponentNames?: string[];
  userScore: number;
  opponentScore: number;
  result: 'win' | 'loss' | 'draw';
  venue?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType =
  | 'post_comment'
  | 'post_like'
  | 'team_invite'
  | 'team_request'
  | 'tournament_registration'
  | 'tournament_result'
  | 'follow_request'
  | 'follow_accepted'
  | 'match_result'
  | 'follow' // "Someone followed you"
  | 'invite' // "You were invited to Team X"
  | 'role_change' // "You are now Captain"
  | 'kicked' // "You were removed from Team Y"
  | 'general';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  link?: string;
  read: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Chat {
  id: string;
  participantIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderNickname: string;
  senderAvatar?: string;
  text: string;
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  session: any;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

