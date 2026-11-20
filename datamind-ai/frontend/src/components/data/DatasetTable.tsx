import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, Copy, Check, Filter } from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface DatasetTableProps {
  data: Record<string, any>[];
  columnTypes?: {
    numeric: string[];
    datetime: string[];
    categorical: string[];
  };
  totalRows?: number;
}

export const DatasetTable: React.FC<DatasetTableProps> = ({
  data,
  columnTypes,
  totalRows,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(15);
  const [selectedColumn, setSelectedColumn] = useState<string>('all');
  const [copied, setCopied] = useState(false);

  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  const getColType = (col: string): 'numeric' | 'datetime' | 'categorical' => {
    if (columnTypes?.numeric?.includes(col)) return 'numeric';
    if (columnTypes?.datetime?.includes(col)) return 'datetime';
    return 'categorical';
  };

  // Filtered rows
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter((row) => {
      if (selectedColumn !== 'all') {
        const val = row[selectedColumn];
        return val !== null && val !== undefined && String(val).toLowerCase().includes(term);
      }
      return Object.values(row).some(
        (val) => val !== null && val !== undefined && String(val).toLowerCase().includes(term)
      );
    });
  }, [data, searchTerm, selectedColumn]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = page * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(paginatedData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground text-sm">
        No preview data available for this dataset.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search table values..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>

          <select
            value={selectedColumn}
            onChange={(e) => {
              setSelectedColumn(e.target.value);
              setPage(0);
            }}
            className="px-2.5 py-1.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          >
            <option value="all">All columns</option>
            {columns.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyJSON}
            icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            className="text-xs h-8"
          >
            {copied ? 'Copied Page' : 'Copy JSON'}
          </Button>

          <span className="text-xs text-muted-foreground font-mono">
            Showing {filteredData.length} of {totalRows ?? data.length} rows
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="border border-border rounded-xl overflow-hidden bg-card shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-muted/60 border-b border-border">
                <th className="py-2.5 px-3 font-semibold text-muted-foreground w-12 text-center">
                  #
                </th>
                {columns.map((col) => {
                  const type = getColType(col);
                  return (
                    <th key={col} className="py-2.5 px-3 font-semibold text-foreground whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>{col}</span>
                        <span
                          className={`text-[9px] px-1 py-0.2 rounded font-mono uppercase font-semibold ${
                            type === 'numeric'
                              ? 'bg-blue-500/10 text-blue-500'
                              : type === 'datetime'
                              ? 'bg-purple-500/10 text-purple-500'
                              : 'bg-emerald-500/10 text-emerald-500'
                          }`}
                        >
                          {type.slice(0, 3)}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedData.map((row, idx) => (
                <tr key={idx} className="hover:bg-muted/40 transition-colors">
                  <td className="py-2 px-3 text-muted-foreground text-center font-mono text-[10px]">
                    {page * pageSize + idx + 1}
                  </td>
                  {columns.map((col) => {
                    const val = row[col];
                    const isNull = val === null || val === undefined;
                    return (
                      <td
                        key={col}
                        className={`py-2 px-3 font-mono text-xs whitespace-nowrap ${
                          isNull ? 'text-destructive/60 italic' : 'text-foreground'
                        }`}
                      >
                        {isNull ? 'null' : String(val)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(0);
              }}
              className="text-xs bg-card border border-border rounded-lg px-2 py-0.5"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:pointer-events-none text-foreground"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-1 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:pointer-events-none text-foreground"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
