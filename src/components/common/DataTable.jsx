import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import './DataTable.css';

const DEFAULT_PAGE_SIZES = [10, 25, 50];

function DataTable({
  fetchData,
  normalizeResponse,
  columns,
  renderRow,
  getRowKey,
  initialQuery,
  searchPlaceholder = 'Search...',
  searchLabel = 'Search',
  filterControls = [],
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  emptyMessage = 'No data found.',
  singularLabel = 'Item',
  pluralLabel = 'Items',
  errorMessage = 'Failed to load data'
}) {
  const [query, setQuery] = useState(initialQuery);
  const [searchInput, setSearchInput] = useState(initialQuery.search || '');
  const [debouncedSearch, setDebouncedSearch] = useState(initialQuery.search || '');
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({
    totalItems: 0,
    page: initialQuery.page || 1,
    limit: initialQuery.limit || pageSizeOptions[0] || 10,
    totalPages: 1
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    setQuery((current) => {
      if ((current.search || '') === debouncedSearch) {
        return current;
      }

      return {
        ...current,
        search: debouncedSearch,
        page: 1
      };
    });
  }, [debouncedSearch]);

  useEffect(() => {
    let isSubscribed = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetchData(query);

        if (!response?.success) {
          throw new Error(errorMessage);
        }

        if (!isSubscribed) {
          return;
        }

        const normalized = normalizeResponse(response, query);
        setRows(normalized.rows);
        setPagination({
          totalItems: normalized.totalItems,
          page: normalized.page,
          limit: normalized.limit,
          totalPages: normalized.totalPages
        });
      } catch (err) {
        console.error(err);

        if (!isSubscribed) {
          return;
        }

        setRows([]);
        setError(err.message || errorMessage);
        toast.error(err.message || errorMessage);
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isSubscribed = false;
    };
  }, [errorMessage, fetchData, normalizeResponse, query]);

  const updateQuery = (updates) => {
    setQuery((current) => ({
      ...current,
      ...updates
    }));
  };

  const handleRetry = () => {
    setQuery((current) => ({ ...current }));
  };

  const handleClearFilters = () => {
    setSearchInput(initialQuery.search || '');
    setDebouncedSearch(initialQuery.search || '');
    setQuery(initialQuery);
  };

  const hasActiveFilters = Object.keys(initialQuery).some((key) => {
    const currentValue = query[key];
    const initialValue = initialQuery[key];
    return currentValue !== initialValue;
  });

  const startItem = rows.length === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endItem = rows.length === 0 ? 0 : startItem + rows.length - 1;
  const itemLabel = pagination.totalItems === 1 ? singularLabel : pluralLabel;

  const visiblePages = [];
  const firstVisiblePage = Math.max(1, pagination.page - 2);
  const lastVisiblePage = Math.min(pagination.totalPages, firstVisiblePage + 4);

  for (let page = firstVisiblePage; page <= lastVisiblePage; page += 1) {
    visiblePages.push(page);
  }

  return (
    <div className="app-data-table-shell">
      <div className="app-data-table-toolbar">
        <div className="app-data-table-toolbar-main">
          <label className="app-data-table-field app-data-table-field--search">
            <span>{searchLabel}</span>
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={searchPlaceholder}
            />
          </label>

          {filterControls.map((control) => (
            <label key={control.key} className="app-data-table-field">
              <span>{control.label}</span>
              {control.type === 'date' ? (
                <input
                  type="date"
                  value={query[control.key] ?? ''}
                  min={control.minKey ? query[control.minKey] || undefined : undefined}
                  max={control.maxKey ? query[control.maxKey] || undefined : undefined}
                  onChange={(event) =>
                    updateQuery({
                      [control.key]: event.target.value,
                      page: 1
                    })
                  }
                />
              ) : (
                <select
                  value={query[control.key] ?? ''}
                  onChange={(event) =>
                    updateQuery({
                      [control.key]: event.target.value,
                      page: 1
                    })
                  }
                >
                  {control.options.map((option) => (
                    <option key={`${control.key}-${option.value || 'all'}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </label>
          ))}

          {'limit' in query && (
            <label className="app-data-table-field">
              <span>Rows</span>
              <select
                value={query.limit}
                onChange={(event) =>
                  updateQuery({
                    limit: Number(event.target.value) || pageSizeOptions[0] || 10,
                    page: 1
                  })
                }
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="app-data-table-toolbar-side">
          <button
            type="button"
            className="app-data-table-clear-btn"
            onClick={handleClearFilters}
            disabled={!hasActiveFilters}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {loading ? (
        <div className="app-data-table-state">
          <div className="app-data-table-spinner"></div>
          <p>Loading...</p>
        </div>
      ) : error ? (
        <div className="app-data-table-state">
          <p className="app-data-table-error">{error}</p>
          <button type="button" onClick={handleRetry} className="app-data-table-retry-btn">
            Retry
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="app-data-table-state">
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <>
          <div className="app-data-table-list-header">
            <p className="app-data-table-range-text">
              Showing {startItem}-{endItem} of {pagination.totalItems}
            </p>
          </div>

          <div className="app-data-table-container">
            <table className="app-data-table">
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th key={column.key}>
                      {column.sortKey ? (
                        <button
                          type="button"
                          className={`app-data-table-sort-btn ${query.sortBy === column.sortKey ? 'active' : ''}`}
                          onClick={() =>
                            updateQuery({
                              sortBy: column.sortKey,
                              sortOrder:
                                query.sortBy === column.sortKey && query.sortOrder === 'asc'
                                  ? 'desc'
                                  : 'asc',
                              page: 1
                            })
                          }
                        >
                          <span>{column.label}</span>
                          <span className="app-data-table-sort-icons" aria-hidden="true">
                            <span className={query.sortBy === column.sortKey && query.sortOrder === 'asc' ? 'active' : ''}>
                              ↑
                            </span>
                            <span className={query.sortBy === column.sortKey && query.sortOrder === 'desc' ? 'active' : ''}>
                              ↓
                            </span>
                          </span>
                        </button>
                      ) : (
                        column.label
                      )}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {rows.map((row, index) => (
                  <tr key={getRowKey(row, index)}>
                    {renderRow(row)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="app-data-table-pagination">
            <p className="app-data-table-pagination-summary">
              Page {pagination.page} of {pagination.totalPages}
            </p>

            <div className="app-data-table-pagination-controls">
              <button
                type="button"
                className="app-data-table-page-btn"
                onClick={() => updateQuery({ page: pagination.page - 1 })}
                disabled={pagination.page <= 1}
              >
                Previous
              </button>

              {visiblePages.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  className={`app-data-table-page-btn ${pageNumber === pagination.page ? 'active' : ''}`}
                  onClick={() => updateQuery({ page: pageNumber })}
                >
                  {pageNumber}
                </button>
              ))}

              <button
                type="button"
                className="app-data-table-page-btn"
                onClick={() => updateQuery({ page: pagination.page + 1 })}
                disabled={pagination.page >= pagination.totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default DataTable;
