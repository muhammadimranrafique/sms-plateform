/** Unified success envelope helpers. Mirrors @sms/types ApiSuccess shape. */
export const ok = <T>(data: T, meta?: Record<string, unknown>) => ({
  success: true as const,
  data,
  ...(meta ? { meta } : {}),
});

export const created = <T>(data: T) => ({
  success: true as const,
  data,
});
