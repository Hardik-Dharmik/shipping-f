import { Link } from 'react-router-dom';
import { api } from '../../../services/api';
import OrdersTable from './OrdersTable';
import './Orders.css';

function Orders() {
  return (
    <div className="orders-page">
      <div className="orders-container">
        <div className="orders-header">
          <div>
            <h1>Orders</h1>
            <Link to="/orders/manual" className="details-link">Create Manual Order</Link>
            <p className="subtitle">View all created shipments</p>
          </div>
        </div>

        <OrdersTable
          fetchOrders={api.getOrders}
          detailsPathBuilder={(order) => `/orders/${order.id}`}
        />
      </div>
    </div>
  );
}

export default Orders;
