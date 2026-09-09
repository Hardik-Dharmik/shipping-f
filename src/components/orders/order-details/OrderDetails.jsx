import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api } from '../../../services/api';
import OrderDetailsView from './OrderDetailsView';
import { useAuth } from '../../../contexts/AuthContext';
import './OrderDetails.css';

function OrderDetails() {
  const { orderId } = useParams();
  const location = useLocation();
  const { isAdmin } = useAuth();
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadOrder() {
      setLoading(true);
      setError('');
      try {
        const response = await api.getOrder(orderId);
        if (response?.success === false) throw new Error(response.message || 'Failed to load order');
        const data = response?.data ?? response;
        if (active) setOrder(data?.order ?? data);
      } catch (err) {
        if (active) {
          setError(err.message || 'Failed to load order');
          toast.error(err.message || 'Failed to load order');
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    loadOrder();
    return () => { active = false; };
  }, [orderId]);

  if (loading) {
    return (
      <div className="order-details-page">
        <div className="order-details-container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading order...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-details-page">
        <div className="order-details-container">
          <div className="error-state">
            <p className="error-message">{error || 'Order not found'}</p>
            {!isAdmin && (
              <Link to="/orders/list" className="details-link back-link">
                Back to Orders
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <OrderDetailsView order={order} showBackLink={!isAdmin} />;
}

export default OrderDetails;
