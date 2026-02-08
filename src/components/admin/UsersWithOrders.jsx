import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api } from '../../services/api';
import './Users.css';

function UsersWithOrders() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.getUsersWithOrderCount();
      if (response.success) {
        setUsers(response.users || response.data || []);
      } else {
        setError('Failed to fetch user order counts');
      }
    } catch (err) {
      console.error('Error fetching user order counts:', err);
      setError(err.message || 'Failed to load user order counts');
      toast.error(err.message || 'Failed to load user order counts');
    } finally {
      setLoading(false);
    }
  };

  const totalOrders = useMemo(() => {
    return users.reduce((sum, user) => sum + (Number(user.orders_count) || 0), 0);
  }, [users]);

  return (
    <div className="users-page user-order-page">
      <div className="users-container">
        <div className="users-header">
          <div>
            <h1>Orders</h1>
            <p className="subtitle">User-wise shipment orders created</p>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading user order counts...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p className="error-message">{error}</p>
            <button onClick={fetchUsers} className="btn-retry">
              Retry
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <p>No users found.</p>
          </div>
        ) : (
          <>
            <div className="list-header">
              <span className="count-badge">
                {users.length} {users.length === 1 ? 'User' : 'Users'}
              </span>
              <span className="count-badge">
                {totalOrders} {totalOrders === 1 ? 'Order' : 'Orders'}
              </span>
            </div>
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Company</th>
                    <th>Orders</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="table-user-info">
                          <strong>{user.name}</strong>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default UsersWithOrders;
