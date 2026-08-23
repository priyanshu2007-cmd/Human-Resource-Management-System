"use client";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // Build page numbers with ellipsis
  function getPageNumbers(): (number | "...")[] {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      ) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }

  return (
    <div className="flex items-center justify-center gap-1 pt-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="flex items-center justify-center w-8 h-8 rounded text-body-sm disabled:opacity-30 cursor-pointer disabled:cursor-default transition-colors hover:bg-[var(--surface-container-high)]"
        style={{ color: "var(--on-surface-variant)" }}
        aria-label="Previous page"
      >
        <span className="material-symbols-outlined text-lg">chevron_left</span>
      </button>

      {getPageNumbers().map((page, idx) =>
        page === "..." ? (
          <span
            key={`ellipsis-${idx}`}
            className="w-8 h-8 flex items-center justify-center text-body-sm"
            style={{ color: "var(--on-surface-variant)" }}
          >
            …
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className="w-8 h-8 rounded text-body-sm font-medium cursor-pointer transition-colors"
            style={{
              background:
                page === currentPage ? "var(--primary)" : "transparent",
              color:
                page === currentPage
                  ? "var(--on-primary)"
                  : "var(--on-surface-variant)",
            }}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="flex items-center justify-center w-8 h-8 rounded text-body-sm disabled:opacity-30 cursor-pointer disabled:cursor-default transition-colors hover:bg-[var(--surface-container-high)]"
        style={{ color: "var(--on-surface-variant)" }}
        aria-label="Next page"
      >
        <span className="material-symbols-outlined text-lg">
          chevron_right
        </span>
      </button>
    </div>
  );
}

// Server-side pagination helper for Link-based navigation (used in Server Components)
import Link from "next/link";

interface ServerPaginationProps {
  currentPage: number;
  totalPages: number;
  baseHref: string;
  searchParams?: Record<string, string>;
}

export function ServerPagination({
  currentPage,
  totalPages,
  baseHref,
  searchParams = {},
}: ServerPaginationProps) {
  if (totalPages <= 1) return null;

  function buildHref(page: number): string {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(page));
    return `${baseHref}?${params.toString()}`;
  }

  function getPageNumbers(): (number | "...")[] {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      ) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }

  return (
    <div className="flex items-center justify-center gap-1 pt-4">
      {currentPage > 1 ? (
        <Link
          href={buildHref(currentPage - 1)}
          className="flex items-center justify-center w-8 h-8 rounded text-body-sm transition-colors hover:bg-[var(--surface-container-high)]"
          style={{ color: "var(--on-surface-variant)" }}
          aria-label="Previous page"
        >
          <span className="material-symbols-outlined text-lg">
            chevron_left
          </span>
        </Link>
      ) : (
        <span className="flex items-center justify-center w-8 h-8 rounded text-body-sm opacity-30">
          <span className="material-symbols-outlined text-lg">
            chevron_left
          </span>
        </span>
      )}

      {getPageNumbers().map((page, idx) =>
        page === "..." ? (
          <span
            key={`ellipsis-${idx}`}
            className="w-8 h-8 flex items-center justify-center text-body-sm"
            style={{ color: "var(--on-surface-variant)" }}
          >
            …
          </span>
        ) : (
          <Link
            key={page}
            href={buildHref(page)}
            className="w-8 h-8 rounded text-body-sm font-medium flex items-center justify-center transition-colors"
            style={{
              background:
                page === currentPage ? "var(--primary)" : "transparent",
              color:
                page === currentPage
                  ? "var(--on-primary)"
                  : "var(--on-surface-variant)",
            }}
          >
            {page}
          </Link>
        )
      )}

      {currentPage < totalPages ? (
        <Link
          href={buildHref(currentPage + 1)}
          className="flex items-center justify-center w-8 h-8 rounded text-body-sm transition-colors hover:bg-[var(--surface-container-high)]"
          style={{ color: "var(--on-surface-variant)" }}
          aria-label="Next page"
        >
          <span className="material-symbols-outlined text-lg">
            chevron_right
          </span>
        </Link>
      ) : (
        <span className="flex items-center justify-center w-8 h-8 rounded text-body-sm opacity-30">
          <span className="material-symbols-outlined text-lg">
            chevron_right
          </span>
        </span>
      )}
    </div>
  );
}
