import { PAGINATION_DEFAULTS } from "@repo/constants";

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

// Convert query page/limit jadi skip/take buat Prisma findMany()
export function getPaginationParams(query: PaginationQuery) {
  const page = Math.max(query.page ?? PAGINATION_DEFAULTS.PAGE, 1);
  const limit = Math.min(
    Math.max(query.limit ?? PAGINATION_DEFAULTS.LIMIT, 1),
    PAGINATION_DEFAULTS.MAX_LIMIT,
  );
  return { page, limit, skip: (page - 1) * limit, take: limit };
}

export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
  };
}

export function paginate<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): Paginated<T> {
  return { items, meta: buildPaginationMeta(total, page, limit) };
}
