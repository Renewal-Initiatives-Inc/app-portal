/**
 * Zitadel Management API TypeScript Types
 * Based on Zitadel v2 API
 */

// User states as defined by Zitadel
export type UserState =
  | 'USER_STATE_UNSPECIFIED'
  | 'USER_STATE_ACTIVE'
  | 'USER_STATE_INACTIVE'
  | 'USER_STATE_DELETED'
  | 'USER_STATE_LOCKED'
  | 'USER_STATE_INITIAL';

// Human user profile
export interface HumanProfile {
  givenName: string;
  familyName: string;
  nickName?: string;
  displayName?: string;
  preferredLanguage?: string;
  gender?: 'GENDER_UNSPECIFIED' | 'GENDER_FEMALE' | 'GENDER_MALE' | 'GENDER_DIVERSE';
  avatarUrl?: string;
}

// Human user email
export interface HumanEmail {
  email: string;
  isEmailVerified: boolean;
}

// Human user phone
export interface HumanPhone {
  phone?: string;
  isPhoneVerified?: boolean;
}

// Human user from Zitadel
export interface HumanUser {
  userId: string;
  profile: HumanProfile;
  email: HumanEmail;
  phone?: HumanPhone;
}

// User details from list/get operations
export interface ZitadelUser {
  userId: string;
  state: UserState;
  userName: string;
  loginNames: string[];
  preferredLoginName: string;
  human?: HumanUser;
  type: {
    type: 'human' | 'machine';
  };
}

// User details from search results (v2 API returns user fields directly, not nested under 'user')
export interface ZitadelUserDetails {
  userId: string;
  state: UserState;
  username: string;
  loginNames: string[];
  preferredLoginName: string;
  human?: {
    profile: HumanProfile;
    email: HumanEmail;
    phone?: HumanPhone;
    passwordChanged?: string;
  };
  details: {
    sequence: string;
    creationDate: string;
    changeDate: string;
    resourceOwner: string;
  };
}

// List users response
export interface ListUsersResponse {
  details: {
    totalResult: string;
    processedSequence: string;
    timestamp: string;
  };
  sortingColumn: number;
  result: ZitadelUserDetails[];
}

// Create human user request
export interface CreateHumanUserRequest {
  profile: {
    givenName: string;
    familyName: string;
    nickName?: string;
    displayName?: string;
    preferredLanguage?: string;
  };
  email: {
    email: string;
    isVerified?: boolean;
    // Zitadel will send verification email if not verified
  };
  phone?: {
    phone: string;
    isVerified?: boolean;
  };
  password?: {
    password: string;
    changeRequired?: boolean;
  };
  // If no password provided, Zitadel sends initialization email
}

// Create user response
export interface CreateUserResponse {
  userId: string;
  details: {
    sequence: string;
    creationDate: string;
    resourceOwner: string;
  };
}

// User grant (role assignment)
export interface UserGrant {
  id: string;
  details: {
    sequence: string;
    creationDate: string;
    changeDate: string;
    resourceOwner: string;
  };
  userId: string;
  projectId: string;
  projectGrantId?: string;
  roleKeys: string[];
  state: 'USER_GRANT_STATE_ACTIVE' | 'USER_GRANT_STATE_INACTIVE';
}

// List user grants response
export interface ListUserGrantsResponse {
  details: {
    totalResult: string;
    processedSequence: string;
    timestamp: string;
  };
  result: UserGrant[];
}

// Create user grant request
export interface CreateUserGrantRequest {
  userId: string;
  projectId: string;
  projectGrantId?: string;
  roleKeys: string[];
}

// Create user grant response
export interface CreateUserGrantResponse {
  userGrantId: string;
  details: {
    sequence: string;
    creationDate: string;
    resourceOwner: string;
  };
}

// Update user grant request
export interface UpdateUserGrantRequest {
  roleKeys: string[];
}

// Error response from Zitadel API
export interface ZitadelError {
  code: number;
  message: string;
  details?: Array<{
    '@type': string;
    id?: string;
    message?: string;
  }>;
}

// Simplified user type for our application
export interface PortalUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatarUrl?: string;
  status: 'active' | 'inactive' | 'pending';
  roles: string[];
  isAdmin: boolean;
  createdAt: string;
  lastLogin?: string;
}

// User invite input
export interface InviteUserInput {
  email: string;
  firstName?: string;
  lastName?: string;
  appPermissions: string[]; // app slugs
  isAdmin: boolean;
}

// User permissions update input
export interface UpdateUserPermissionsInput {
  userId: string;
  appPermissions: string[]; // app slugs to grant (others will be revoked)
  isAdmin: boolean;
}
