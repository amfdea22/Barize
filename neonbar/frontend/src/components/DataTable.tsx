import type { ReactNode } from 'react';

export type Column<T> = {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
  emptyMessage = 'Nenhum registro encontrado',
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-lg ghost-border" role="region" aria-label="Tabela de dados">
      <table className="w-full text-sm" role="table">
        <thead>
          <tr className="bg-[var(--color-surface-low)]" role="row">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                role="columnheader"
                className={`px-4 py-3 text-left text-xs font-medium text-[var(--color-on-surface-variant)] font-mono tracking-wider uppercase ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[rgba(255,255,255,0.06)]" role="rowgroup">
          {data.length === 0 ? (
            <tr role="row">
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-[var(--color-outline)]"
                role="cell"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, idx) => (
              <tr
                key={item.id || idx}
                onClick={() => onRowClick?.(item)}
                onKeyDown={onRowClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onRowClick(item); } : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                role="row"
                aria-label={item.nome || `Linha ${idx + 1}`}
                className={`
                  transition-colors duration-100
                  ${onRowClick ? 'cursor-pointer hover:bg-[var(--color-surface-container-high)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary-container)] focus-visible:outline-none' : ''}
                  bg-[var(--color-surface)]
                `}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-[var(--color-on-surface)] ${col.className || ''}`}
                    role="cell"
                  >
                    {col.render
                      ? col.render(item)
                      : (item[col.key] ?? '-')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
