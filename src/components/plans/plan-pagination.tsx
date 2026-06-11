import Link from "next/link";

export function PlanPagination({
  page,
  pageSize,
  total,
  pathname,
  params,
}: {
  page: number;
  pageSize: number;
  total: number;
  pathname: string;
  params: Record<string, string | null>;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;

  const hrefFor = (target: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) query.set(key, value);
    }
    query.set("page", String(target));
    return `${pathname}?${query.toString()}`;
  };

  return (
    <nav className="plan-pagination" aria-label="规划分页">
      <Link aria-disabled={page <= 1} className={`btn ${page <= 1 ? "disabled" : ""}`} href={hrefFor(Math.max(1, page - 1))}>
        上一页
      </Link>
      <span className="mono">{page} / {pages}</span>
      <Link aria-disabled={page >= pages} className={`btn ${page >= pages ? "disabled" : ""}`} href={hrefFor(Math.min(pages, page + 1))}>
        下一页
      </Link>
    </nav>
  );
}
