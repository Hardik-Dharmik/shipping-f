import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api } from '../../services/api';
import { formatCurrency } from '../../utils/currency';
import './OrderDetails.css';

function OrderDetails() {
  const { orderId } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [error, setError] = useState('');

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.getOrders();

      if (response.success) {
        const list = response.data || [];
        const match = list.find(
          (item) => item.id === orderId || item.awb_number === orderId
        );

        if (match) {
          setOrder(match);
        } else {
          setError('Order not found');
        }
      } else {
        setError('Failed to fetch order');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load order');
      toast.error('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!order) {
      fetchOrder();
    }
  }, [orderId]);

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

  const data = order?.order_data || {};
  const pickup = data.pickup || {};
  const destination = data.destination || {};
  const weight = data.weight || {};
  const shipmentValue = data.shipmentValue || {};
  const boxes = data.boxes || [];
  const compliance = data.compliance || {};

  const invoiceUrls = useMemo(() => {
    const fromOrder = order?.invoice_urls || [];
    const fromData = data.invoice_urls || [];
    return fromOrder.length ? fromOrder : fromData;
  }, [order, data]);

  const packingListUrls = useMemo(() => {
    const fromOrder = order?.packing_list_urls || [];
    const fromData = data.packing_list_urls || [];
    return fromOrder.length ? fromOrder : fromData;
  }, [order, data]);

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
            <Link to="/orders/list" className="details-link back-link">
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-details-page">
      <div className="order-details-container">
        <div className="order-details-header">
          <div>
            <h1>Order Details</h1>
            <p className="subtitle">AWB {order.awb_number}</p>
          </div>
          <Link to="/orders/list" className="details-link back-link">
            Back to Orders
          </Link>
        </div>

        <div className="order-details-grid">
          <div className="details-card">
            <h3>Summary</h3>
            <div className="details-row">
              <span>Status</span>
              <span className="value">{order.status || '-'}</span>
            </div>
            <div className="details-row">
              <span>Created</span>
              <span className="value">{formatDate(order.created_at)}</span>
            </div>
            <div className="details-row">
              <span>Order ID</span>
              <span className="value">{data.orderId || order.id}</span>
            </div>
            <div className="details-row">
              <span>Carrier</span>
              <span className="value">{order.carrier?.name || '-'}</span>
            </div>
            <div className="details-row">
              <span>Cost</span>
              <span className="value">{formatCurrency(order.carrier?.cost || 0)}</span>
            </div>
            <div className="details-row">
              <span>Shipment Value</span>
              <span className="value">
                {formatCurrency(shipmentValue.value || 0)} {shipmentValue.currency || ''}
              </span>
            </div>
          </div>

          <div className="details-card">
            <h3>Route</h3>
            <div className="details-row">
              <span>Pickup</span>
              <span className="value">{pickup.country || '-'} {pickup.pincode ? `(${pickup.pincode})` : ''}</span>
            </div>
            <div className="details-row">
              <span>Destination</span>
              <span className="value">
                {destination.country || '-'} {destination.pincode ? `(${destination.pincode})` : ''}
              </span>
            </div>
            <div className="details-row">
              <span>AWB Label</span>
              <span className="value">
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
                  '-'
                )}
              </span>
            </div>
          </div>

          <div className="details-card">
            <h3>Weights</h3>
            <div className="details-row">
              <span>Declared</span>
              <span className="value">
                {weight.declared ?? '-'} {weight.unit || ''}
              </span>
            </div>
            <div className="details-row">
              <span>Chargeable</span>
              <span className="value">
                {weight.chargeable ?? '-'} {weight.unit || ''}
              </span>
            </div>
          </div>

          <div className="details-card">
            <h3>Compliance</h3>
            <div className="details-row">
              <span>Require DO</span>
              <span className="value">{compliance.requireDO ? 'Yes' : 'No'}</span>
            </div>
            <div className="details-row">
              <span>Require BOE</span>
              <span className="value">{compliance.requireBOE ? 'Yes' : 'No'}</span>
            </div>
            <div className="details-row">
              <span>Duty Exemption</span>
              <span className="value">{compliance.dutyExemption ? 'Yes' : 'No'}</span>
            </div>
            <div className="details-row">
              <span>Export Declaration</span>
              <span className="value">{compliance.exportDeclaration ? 'Yes' : 'No'}</span>
            </div>
            <div className="details-row">
              <span>Export Charge</span>
              <span className="value">{formatCurrency(compliance.exportDeclarationCharge || 0)}</span>
            </div>
          </div>
        </div>

        <div className="details-card full-width">
          <h3>Boxes</h3>
          {boxes.length === 0 ? (
            <p className="empty-text">No box details available.</p>
          ) : (
            <div className="box-grid">
              {boxes.map((box, index) => (
                <div key={`${order.id}-box-${index}`} className="box-card">
                  <div className="details-row">
                    <span>Quantity</span>
                    <span className="value">{box.quantity}</span>
                  </div>
                  <div className="details-row">
                    <span>Dimensions</span>
                    <span className="value">
                      {box.dimensions?.length} x {box.dimensions?.breadth} x {box.dimensions?.height}{' '}
                      {box.dimensions?.unit || ''}
                    </span>
                  </div>
                  <div className="details-row">
                    <span>Actual Weight</span>
                    <span className="value">{box.actualWeight ?? '-'}</span>
                  </div>
                  <div className="details-row">
                    <span>Chargeable Weight</span>
                    <span className="value">{box.chargeableWeight ?? '-'}</span>
                  </div>
                  <div className="details-row">
                    <span>Volumetric Weight</span>
                    <span className="value">{box.volumetricWeight ?? '-'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="details-card full-width">
          <h3>Documents</h3>
          <div className="documents-section">
            <div>
              <h4>Invoices</h4>
              {invoiceUrls.length === 0 ? (
                <p className="empty-text">No invoices uploaded.</p>
              ) : (
                <div className="document-links">
                  {invoiceUrls.map((url, index) => (
                    <a
                      key={`${order.id}-invoice-${index}`}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="file-link"
                    >
                      Invoice {index + 1}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4>Packing Lists</h4>
              {packingListUrls.length === 0 ? (
                <p className="empty-text">No packing lists uploaded.</p>
              ) : (
                <div className="document-links">
                  {packingListUrls.map((url, index) => (
                    <a
                      key={`${order.id}-packing-${index}`}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="file-link"
                    >
                      Packing List {index + 1}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetails;
