/** Build a standard paginated response envelope. */
export function paginate<T>(data: T[], total: number, page: number, limit: number) {
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

/** Convert page/limit to Prisma skip/take. */
export function toSkipTake(page: number, limit: number) {
  return { skip: (page - 1) * limit, take: limit };
}
