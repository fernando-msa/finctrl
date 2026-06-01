"use client";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <button
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        disabled={currentPage <= 1}
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
      >
        Anterior
      </button>

      <span className="text-sm text-slate-600">
        Página {currentPage} de {totalPages}
      </span>

      <button
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        disabled={currentPage >= totalPages}
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
      >
        Próximo
      </button>
    </nav>
  );
}

export function usePagination<T>(items: T[], page: number, pageSize: number = 10) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const end = start + pageSize;
  const paginatedItems = items.slice(start, end);

  return { paginatedItems, totalPages, safePage };
}
