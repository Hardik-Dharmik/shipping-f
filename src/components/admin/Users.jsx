import DataTable from '../common/DataTable';
import { api } from '../../services/api';
import './Users.css';

const DEFAULT_QUERY = {
  search: '',
  role: '',
  status: '',
  sortBy: 'created_at',
  sortOrder: 'desc',
  page: 1,
  limit: 10
};

const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'admin', label: 'Admin' },
  { value: 'user', label: 'User' }
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'approved', label: 'Approved' },
  { value: 'pending', label: 'Pending' },
  { value: 'rejected', label: 'Rejected' }
];

const USER_COLUMNS = [
  { key: 'name', label: 'Name', sortKey: 'name' },
  { key: 'email', label: 'Email', sortKey: 'email' },
  { key: 'company', label: 'Company', sortKey: 'company_name' },
  { key: 'role', label: 'Role', sortKey: 'role' },
  { key: 'status', label: 'Status', sortKey: 'approval_status' },
  { key: 'registered', label: 'Registered', sortKey: 'created_at' },
  { key: 'document', label: 'Document' }
];

const formatDate = (dateString) => {
  if (!dateString) return '-';

  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusBadgeClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'approved':
      return 'status-approved';
    case 'pending':
      return 'status-pending';
    case 'rejected':
      return 'status-rejected';
    default:
      return 'status-pending';
  }
};

const getRoleBadgeClass = (role) => {
  switch (role?.toLowerCase()) {
    case 'admin':
      return 'role-admin';
    case 'user':
      return 'role-user';
    default:
      return 'role-user';
  }
};

const compareValues = (left, right, sortOrder) => {
  if (left === right) return 0;
  if (left == null || left === '') return 1;
  if (right == null || right === '') return -1;

  const direction = sortOrder === 'asc' ? 1 : -1;

  if (left instanceof Date && right instanceof Date) {
    return (left.getTime() - right.getTime()) * direction;
  }

  return String(left).localeCompare(String(right), undefined, {
    numeric: true,
    sensitivity: 'base'
  }) * direction;
};

const normalizeUsersResponse = (response, query) => {
  const payload = response?.users || response?.data || [];
  let rows = Array.isArray(payload) ? payload : payload?.users || payload?.items || payload?.results || [];

  if (query.search) {
    const normalizedSearch = query.search.toLowerCase();
    rows = rows.filter((user) =>
      [user.name, user.email, user.company_name, user.role, user.approval_status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch))
    );
  }

  if (query.role) {
    rows = rows.filter((user) => String(user.role || '').toLowerCase() === String(query.role).toLowerCase());
  }

  if (query.status) {
    rows = rows.filter(
      (user) => String(user.approval_status || '').toLowerCase() === String(query.status).toLowerCase()
    );
  }

  if (query.sortBy) {
    rows = [...rows].sort((leftUser, rightUser) => {
      const leftValue = query.sortBy === 'created_at' ? new Date(leftUser.created_at) : leftUser[query.sortBy];
      const rightValue = query.sortBy === 'created_at' ? new Date(rightUser.created_at) : rightUser[query.sortBy];
      return compareValues(leftValue, rightValue, query.sortOrder);
    });
  }

  const totalItems = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / query.limit));
  const currentPage = Math.min(query.page, totalPages);
  const startIndex = (currentPage - 1) * query.limit;

  return {
    rows: rows.slice(startIndex, startIndex + query.limit),
    totalItems,
    page: currentPage,
    limit: query.limit,
    totalPages
  };
};

function Users() {
  return (
    <div className="users-page">
      <div className="users-container">
        <div className="users-header">
          <div>
            <h1>All Users</h1>
            <p className="subtitle">View and manage all registered users</p>
          </div>
        </div>

        <DataTable
          fetchData={api.getUsers}
          normalizeResponse={normalizeUsersResponse}
          columns={USER_COLUMNS}
          getRowKey={(user) => user.id}
          initialQuery={DEFAULT_QUERY}
          searchPlaceholder="Search by name, email, company..."
          filterControls={[
            {
              key: 'role',
              label: 'Role',
              options: ROLE_OPTIONS
            },
            {
              key: 'status',
              label: 'Status',
              options: STATUS_OPTIONS
            }
          ]}
          singularLabel="User"
          pluralLabel="Users"
          emptyMessage="No users found."
          errorMessage="Failed to load users"
          renderRow={(user) => (
            <>
              <td>
                <div className="table-user-info">
                  <strong>{user.name || '-'}</strong>
                </div>
              </td>
              <td>{user.email || '-'}</td>
              <td>{user.company_name || '-'}</td>
              <td>
                <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                  {user.role || 'user'}
                </span>
              </td>
              <td>
                <span className={`status-badge ${getStatusBadgeClass(user.approval_status)}`}>
                  {user.approval_status || 'pending'}
                </span>
              </td>
              <td>{formatDate(user.created_at)}</td>
              <td>
                {user.file_url ? (
                  <a
                    href={user.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="file-link"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    View
                  </a>
                ) : (
                  <span className="no-file">-</span>
                )}
              </td>
            </>
          )}
        />
      </div>
    </div>
  );
}

export default Users;
