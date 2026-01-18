// User types
export interface User {
  id: string;
  displayName: string;
  contactInfo: string;
  contactType: 'email' | 'phone';
  checkInIntervalHours: number;
  gracePeriodHours: number;
  isPaused: boolean;
  pausedUntil: string | null;
  reminderEnabled: boolean;
  lastCheckIn: string | null;
  nextDeadline: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  displayName: string;
  contactType: 'email' | 'phone';
  checkInIntervalHours: number;
  gracePeriodHours: number;
  isPaused: boolean;
  pausedUntil: string | null;
  reminderEnabled: boolean;
  lastCheckIn: string | null;
  nextDeadline: string | null;
}

// Contact types
export type ContactStatus = 'pending' | 'accepted' | 'rejected';

export interface Contact {
  id: string;
  userId: string;
  contactUserId: string;
  status: ContactStatus;
  createdAt: string;
  displayName?: string; // Decrypted display name of the contact
}

export interface ContactWithDetails extends Contact {
  displayName: string;
  lastCheckIn: string | null;
}

// Check-in types
export interface CheckIn {
  id: string;
  userId: string;
  checkedInAt: string;
}

export interface CheckInStatus {
  lastCheckIn: string | null;
  nextDeadline: string | null;
  hoursRemaining: number | null;
  status: 'ok' | 'warning' | 'overdue';
  isPaused: boolean;
  pausedUntil: string | null;
}

// Alert types
export interface Alert {
  id: string;
  userId: string;
  triggeredAt: string;
  notifiedContacts: string[];
}

// Invitation types
export interface Invitation {
  id: string;
  fromUserId: string;
  inviteCode: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
}

// API Request/Response types
export interface AuthRequestCodeRequest {
  contactInfo: string;
  contactType: 'email' | 'phone';
}

export interface AuthVerifyRequest {
  contactInfo: string;
  code: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
  isNewUser: boolean;
}

export interface UpdateUserRequest {
  displayName?: string;
  checkInIntervalHours?: number;
  isPaused?: boolean;
  reminderEnabled?: boolean;
}

export interface CreateInvitationResponse {
  inviteCode: string;
  inviteLink: string;
  expiresAt: string;
}

export interface AcceptInvitationRequest {
  inviteCode: string;
}

export interface RegisterPushTokenRequest {
  pushToken: string;
}

// API Error response
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}
