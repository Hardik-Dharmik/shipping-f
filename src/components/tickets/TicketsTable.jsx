import { useCallback } from 'react';
import DataTable from '../common/DataTable';
import { api } from '../../services/api';

const DEFAULT_QUERY = {
  search: '',
  fromDate: '',
  toDate: '',
  sortBy: 'created_at',
  sortOrder: 'desc',
  page: 1,
  limit: 10
};

const TICKET_COLUMNS = [
  { key: 'ticketNumber', label: 'Ticket #' },
  { key: 'awb', label: 'AWB Number'},
  { key: 'user', label: 'User'},
  { key: 'category', label: 'Category'},
  { key: 'subcategory', label: 'Subcategory'},
  { key: 'status', label: 'Status', sortKey: 'status' },
  { key: 'date', label: 'Date', sortKey: 'created_at' },
  { key: 'action', label: 'Action' }
];

const formatDate = (dateString) => {
  if (!dateString) return '-';

  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const compareValues = (left, right, sortOrder) => {
  if (left === right) return 0;
  if (left == null) return 1;
  if (right == null) return -1;

  const direction = sortOrder === 'asc' ? 1 : -1;

  if (left instanceof Date && right instanceof Date) {
    return (left.getTime() - right.getTime()) * direction;
  }

  return String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: 'base' }) * direction;
};

function TicketsTable({
  activeTab,
  isAdmin,
  onViewTicket,
  onCountsChange,
  refreshKey
}) {
  const fetchTickets = useCallback(async (query) => {
    return api.getUserTickets(query);
  }, []);

  const normalizeResponse = useCallback((response, query) => {
    const payload = response?.data || [];
    const allTickets = Array.isArray(payload) ? payload : [];

    const userTickets = allTickets.filter(
      (ticket) => (ticket.created_by_role || 'user') === 'user'
    );
    const adminTickets = allTickets.filter(
      (ticket) => (ticket.created_by_role || 'user') === 'admin'
    );

    onCountsChange?.({
      user: userTickets.length,
      admin: adminTickets.length
    });

    let filteredRows = activeTab === 'admin' ? adminTickets : userTickets;

    if (query.search) {
      const normalizedSearch = query.search.toLowerCase();
      filteredRows = filteredRows.filter((ticket) =>
        [
          ticket.ticket_number,
          ticket.awb_number,
          ticket.username,
          ticket.category,
          ticket.subcategory,
          ticket.status
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch))
      );
    }

    if (query.fromDate) {
      const fromDate = new Date(`${query.fromDate}T00:00:00`);
      filteredRows = filteredRows.filter((ticket) => new Date(ticket.created_at) >= fromDate);
    }

    if (query.toDate) {
      const toDate = new Date(`${query.toDate}T23:59:59`);
      filteredRows = filteredRows.filter((ticket) => new Date(ticket.created_at) <= toDate);
    }

    if (query.sortBy) {
      filteredRows = [...filteredRows].sort((leftTicket, rightTicket) => {
        const leftValue = query.sortBy === 'created_at'
          ? new Date(leftTicket.created_at)
          : leftTicket[query.sortBy];
        const rightValue = query.sortBy === 'created_at'
          ? new Date(rightTicket.created_at)
          : rightTicket[query.sortBy];

        return compareValues(leftValue, rightValue, query.sortOrder);
      });
    }

    const totalItems = filteredRows.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / query.limit));
    const currentPage = Math.min(query.page, totalPages);
    const startIndex = (currentPage - 1) * query.limit;
    const rows = filteredRows.slice(startIndex, startIndex + query.limit);

    return {
      rows,
      totalItems,
      page: currentPage,
      limit: query.limit,
      totalPages
    };
  }, [activeTab, onCountsChange]);

  return (
    <DataTable
      fetchData={fetchTickets}
      normalizeResponse={normalizeResponse}
      columns={TICKET_COLUMNS}
      getRowKey={(ticket) => ticket.id}
      initialQuery={DEFAULT_QUERY}
      resetKey={activeTab}
      searchPlaceholder="Search by ticket, AWB, user, category..."
      filterControls={[
        {
          key: 'fromDate',
          label: 'From Date',
          type: 'date',
          maxKey: 'toDate'
        },
        {
          key: 'toDate',
          label: 'To Date',
          type: 'date',
          minKey: 'fromDate'
        }
      ]}
      singularLabel="Ticket"
      pluralLabel="Tickets"
      emptyMessage="No tickets found in this tab."
      errorMessage="Failed to load tickets"
      refreshKey={refreshKey}
      renderRow={(ticket) => {
        const unreadCount = isAdmin
          ? ticket.unread_admin_count
          : ticket.unread_user_count;

        return (
          <>
            <td>{ticket.ticket_number || '-'}</td>
            <td>{ticket.awb_number || '-'}</td>
            <td>{ticket.username || '-'}</td>
            <td>{ticket.category || '-'}</td>
            <td>{ticket.subcategory || '-'}</td>
            <td>
              <span className={`status-badge ${(ticket.status || '').toLowerCase()}`}>
                {ticket.status || '-'}
              </span>
            </td>
            <td>{formatDate(ticket.created_at)}</td>
            <td>
              <button
                type="button"
                className="view-btn"
                onClick={() => onViewTicket(ticket)}
              >
                View
                {unreadCount > 0 && (
                  <span className="unread-badge">{unreadCount}</span>
                )}
              </button>
            </td>
          </>
        );
      }}
    />
  );
}

export default TicketsTable;
