import { z } from 'zod';

/** Standard success envelope returned by the API. */
export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

/** Standard error envelope returned by the API. */
export interface ApiError {
  success: false;
  code: string;
  message: string;
  details?: unknown;
  requestId?: string;
}

/** Pagination metadata attached to list responses. */
export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const RoleSchema = z.enum(['admin', 'staff', 'viewer']);
export type Role = z.infer<typeof RoleSchema>;

export const IdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
export type IdParam = z.infer<typeof IdParamSchema>;
