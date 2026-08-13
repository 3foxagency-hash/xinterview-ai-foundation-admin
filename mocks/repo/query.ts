import type { PageMeta } from '@/lib/api/contract';

/**
 * Shared list-query helpers.
 *
 * Pagination, sorting and filtering are implemented here exactly once, so every
 * mocked list endpoint has the same semantics as the real API and one DataTable
 * can serve the whole product. A handler that rolls its own paging is how the
 * two drift apart.
 */

export type ListQuery = {
  page: number;
  pageSize: number;
  /** `field:direction` pairs, in precedence order. */
  sort: { field: string; direction: 'asc' | 'desc' }[];
  /** Free-text search. */
  q?: string;
  /** Repeated keys collapse to an array — repeated key means OR. */
  filters: Record<string, string[]>;
};

const RESERVED = new Set(['page', 'pageSize', 'sort', 'q']);
const MAX_PAGE_SIZE = 100;

/** Parses the conventions in one place: `?page=2&pageSize=20&sort=a:desc,b:asc`. */
export function parseListQuery(url: URL): ListQuery {
  const params = url.searchParams;

  const page = Math.max(1, Number(params.get('page') ?? 1) || 1);
  const rawSize = Number(params.get('pageSize') ?? 20) || 20;
  // Cap server-side; a client asking for 10,000 rows gets 100.
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, rawSize));

  const sort = (params.get('sort') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((pair) => {
      const [field, direction] = pair.split(':');
      return {
        field,
        direction: direction === 'desc' ? ('desc' as const) : ('asc' as const),
      };
    });

  const filters: Record<string, string[]> = {};
  for (const key of new Set(params.keys())) {
    if (RESERVED.has(key)) continue;
    filters[key] = params.getAll(key);
  }

  const q = params.get('q') ?? undefined;
  return { page, pageSize, sort, q, filters };
}

export function applySort<T extends Record<string, unknown>>(
  rows: T[],
  sort: ListQuery['sort']
): T[] {
  if (sort.length === 0) return rows;
  // Copy first: callers pass store-owned arrays and an in-place sort would
  // mutate the "database".
  return [...rows].sort((a, b) => {
    for (const { field, direction } of sort) {
      const av = a[field];
      const bv = b[field];
      if (av === bv) continue;
      const less = (av as never) < (bv as never);
      return (less ? -1 : 1) * (direction === 'desc' ? -1 : 1);
    }
    return 0;
  });
}

/** Case-insensitive substring match across the named fields. */
export function applySearch<T extends Record<string, unknown>>(
  rows: T[],
  q: string | undefined,
  fields: (keyof T)[]
): T[] {
  if (!q) return rows;
  const needle = q.toLowerCase();
  return rows.filter((row) =>
    fields.some((f) => String(row[f] ?? '').toLowerCase().includes(needle))
  );
}

/** Exact-match filters; repeated values behave as OR. */
export function applyFilters<T extends Record<string, unknown>>(
  rows: T[],
  filters: ListQuery['filters'],
  allowed: (keyof T)[]
): T[] {
  let out = rows;
  for (const key of allowed) {
    const values = filters[key as string];
    if (!values?.length) continue;
    out = out.filter((row) => values.includes(String(row[key])));
  }
  return out;
}

export function paginate<T>(
  rows: T[],
  page: number,
  pageSize: number
): { data: T[]; meta: PageMeta } {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  return {
    data: rows.slice(start, start + pageSize),
    meta: { page, pageSize, total, totalPages },
  };
}
