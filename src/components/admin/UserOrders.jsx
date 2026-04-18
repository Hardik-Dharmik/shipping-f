import { useCallback } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import OrdersTable from '../orders/order-list/OrdersTable';
import '../orders/order-list/Orders.css';

function UserOrders() {
  const { userId } = useParams();
  const location = useLocation();
  const user = location.state?.user;

  const fetchOrders = useCallback(
    (query) => api.getOrdersByUser(userId, query),
    [userId]
  );

  return (
    <div className="orders-page">
      <div className="orders-container">
        <div className="orders-header">
          <div>
            <h1>Orders</h1>
            <p className="subtitle">
              {user?.name ? `Orders for ${user.name}` : 'Orders for selected user'}
            </p>
          </div>
          <Link to="/admin/users/orders" className="details-link">
            Back to User Orders
          </Link>
        </div>

        <OrdersTable
          fetchOrders={fetchOrders}
          detailsPathBuilder={(order) => `/admin/orders/${order.id}`}
          emptyMessage="No orders found."
        />
      </div>
    </div>
  );
}

export default UserOrders;
