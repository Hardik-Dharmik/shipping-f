import { Link } from 'react-router-dom';
import DataTable from '../common/DataTable';
import { api } from '../../services/api';
import './Users.css';

const DEFAULT_QUERY = {
  search: '',
  sortBy: 'orders_count',
  sortOrder: 'desc',
  page: 1,
  limit: 10
};

const USER_ORDER_COLUMNS = [
  { key: 'name', label: 'Name', sortKey: 'name' },
  { key: 'company', label: 'Company', sortKey: 'company_name' },
  { key: 'orders', label: 'Orders', sortKey: 'orders_count' },
  { key: 'action', label: 'Action' }
];

const compareValues = (left, right, sortOrder) => {
  if (left === right) return 0;
  if (left == null || left === '') return 1;
  if (right == null || right === '') return -1;

  const direction = sortOrder === 'asc' ? 1 : -1;

  if (typeof left === 'number' && typeof right === 'number') {
    return (left - right) * direction;
  }

  return String(left).localeCompare(String(right), undefined, {
    numeric: true,
    sensitivity: 'base'
  }) * direction;
};

const normalizeUsersWithOrdersResponse = (response, query) => {
  const payload = response?.users || response?.data || [];
  let rows = Array.isArray(payload) ? payload : payload?.users || payload?.items || payload?.results || [];

  if (query.search) {
    const normalizedSearch = query.search.toLowerCase();
    rows = rows.filter((user) =>
      [user.name, user.company_name, user.email, user.orders_count]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch))
    );
  }

  if (query.sortBy) {
    rows = [...rows].sort((leftUser, rightUser) => {
      const leftValue = query.sortBy === 'orders_count'
        ? Number(leftUser.orders_count) || 0
        : leftUser[query.sortBy];
      const rightValue = query.sortBy === 'orders_count'
        ? Number(rightUser.orders_count) || 0
        : rightUser[query.sortBy];
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

function UsersWithOrders() {
  return (
    <div className="users-page user-order-page">
      <div className="users-container">
        <div className="users-header">
          <div>
            <h1>Orders</h1>
            <p className="subtitle">User-wise shipment orders created</p>
          </div>
        </div>

        <DataTable
          fetchData={api.getUsersWithOrderCount}
          normalizeResponse={normalizeUsersWithOrdersResponse}
          columns={USER_ORDER_COLUMNS}
          getRowKey={(user) => user.id}
          initialQuery={DEFAULT_QUERY}
          searchPlaceholder="Search by name, company, email..."
          singularLabel="User"
          pluralLabel="Users"
          emptyMessage="No users found."
          errorMessage="Failed to load user order counts"
          renderRow={(user) => (
            <>
              <td>
                <div className="table-user-info">
                  <strong>{user.name || '-'}</strong>
                </div>
              </td>
              <td>{user.company_name || '-'}</td>
              <td>{Number(user.orders_count) || 0}</td>
              <td>
                <Link
                  to={`/admin/users/${user.id}/orders`}
                  state={{ user }}
                  className="details-link"
                >
                  View Orders
                </Link>
              </td>
            </>
          )}
        />
      </div>
    </div>
  );
}

export default UsersWithOrders;
