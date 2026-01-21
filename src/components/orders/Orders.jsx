import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../../services/api';
import { formatCurrency } from '../../utils/currency';
import './Orders.css';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.getOrders();

      if (response.success) {
        setOrders(response.data || []);
      } else {
        setError('Failed to fetch orders');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load orders');
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

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

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'created':
        return 'status-created';
      case 'shipped':
        return 'status-approved';
      case 'cancelled':
        return 'status-rejected';
      default:
        return 'status-pending';
    }
  };

  return (
    <div className="orders-page">
      <div className="orders-container">
        <div className="orders-header">
          <div>
            <h1>Orders</h1>
            <p className="subtitle">View all created shipments</p>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading orders...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p className="error-message">{error}</p>
            <button onClick={fetchOrders} className="btn-retry">Retry</button>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <p>No orders found.</p>
          </div>
        ) : (
          <>
            <div className="list-header">
              <span className="count-badge">
                {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
              </span>
            </div>

            <div className="orders-table-container">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>AWB</th>
                    <th>Carrier</th>
                    <th>Route</th>
                    <th>Weight</th>
                    <th>Shipment Value</th>
                    <th>Cost</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>AWB Label</th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map((order) => {
                    const data = order.order_data;

                    return (
                      <tr key={order.id}>

                        <td className="awb">{order.awb_number}</td>

                        <td>{order.carrier?.name}</td>

                        <td>
                          {data.pickup.country} → {data.destination.country}
                        </td>

                        <td>
                          {data.weight.chargeable} {data.weight.unit}
                        </td>

                        <td>
                          {formatCurrency(data.shipmentValue?.value || 0)}
                        </td>

                        <td>
                          {formatCurrency(order.carrier?.cost || 0)}
                        </td>

                        <td>
                          <span className={`status-badge ${getStatusClass(order.status)}`}>
                            {order.status}
                          </span>
                        </td>

                        <td>{formatDate(order.created_at)}</td>

                        <td>
                          {order.awb_pdf_url ? (
                            <a
                              href={order.awb_pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="file-link"
                            >
                              View
                            </a>
                          ) : (
                            <span className="no-file">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Orders;
