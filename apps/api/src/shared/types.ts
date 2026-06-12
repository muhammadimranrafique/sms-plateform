import type { Role } from '@sms/types';

/** The authenticated actor performing a mutation (set by authGuard). */
export interface Actor {
  id: string;
  email: string;
  role: Role;
}
