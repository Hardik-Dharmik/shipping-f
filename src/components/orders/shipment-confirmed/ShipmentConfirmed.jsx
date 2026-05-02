import { Link, useLocation } from 'react-router-dom';
import { formatCurrency } from '../../../utils/currency';
import './ShipmentConfirmed.css';

function formatDate(value) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ShipmentConfirmed() {
  const location = useLocation();
  const order = location.state?.order || null;
  const orderData = order?.order_data || {};
  const shipmentValue = orderData.shipmentValue || {};
  const carrier = order?.carrier || orderData.carrier || {};
  const pickup = orderData.pickup || {};
  const destination = orderData.destination || {};
  const orderId = order?.id || orderData.orderId || '';
  const awbNumber = order?.awb_number || orderData.awb_number || '';

  return (
    <div className="shipment-confirmed-page">
      <div className="shipment-confirmed-card">
        <div className="shipment-confirmed-badge">Shipment Confirmed</div>
        <h1>Your shipment has been created</h1>
        <p className="shipment-confirmed-subtitle">
          {awbNumber
            ? `AWB ${awbNumber} is ready and has been saved to your orders.`
            : 'Your shipment has been saved successfully and is now available in your orders.'}
        </p>

        {order ? (
          <div className="shipment-confirmed-grid">
            <div className="shipment-confirmed-panel">
              <h2>Shipment Summary</h2>
              <div className="shipment-confirmed-row">
                <span>Status</span>
                <strong>{order.status || 'Created'}</strong>
              </div>
              <div className="shipment-confirmed-row">
                <span>Order ID</span>
                <strong>{orderId || '-'}</strong>
              </div>
              <div className="shipment-confirmed-row">
                <span>AWB</span>
                <strong>{awbNumber || '-'}</strong>
              </div>
              <div className="shipment-confirmed-row">
                <span>Carrier</span>
                <strong>{carrier.name || '-'}</strong>
              </div>
              <div className="shipment-confirmed-row">
                <span>Shipping Cost</span>
                <strong>{formatCurrency(carrier.cost || 0)}</strong>
              </div>
              <div className="shipment-confirmed-row">
                <span>Shipment Value</span>
                <strong>
                  {formatCurrency(shipmentValue.value || 0)}
                  {shipmentValue.currency ? ` ${shipmentValue.currency}` : ''}
                </strong>
              </div>
            </div>

            <div className="shipment-confirmed-panel">
              <h2>Route Details</h2>
              <div className="shipment-confirmed-row">
                <span>Pickup</span>
                <strong>{pickup.country || '-'}{pickup.pincode ? ` (${pickup.pincode})` : ''}</strong>
              </div>
              <div className="shipment-confirmed-row">
                <span>Destination</span>
                <strong>{destination.country || '-'}{destination.pincode ? ` (${destination.pincode})` : ''}</strong>
              </div>
              <div className="shipment-confirmed-row">
                <span>Estimated Delivery</span>
                <strong>{carrier.estimatedDeliveryReadable || carrier.estimatedDelivery || '-'}</strong>
              </div>
              <div className="shipment-confirmed-row">
                <span>Created At</span>
                <strong>{formatDate(order.created_at)}</strong>
              </div>
              <div className="shipment-confirmed-row">
                <span>AWB Label</span>
                <strong>
                  {order.awb_pdf_url ? (
                    <a href={order.awb_pdf_url} target="_blank" rel="noreferrer" className="shipment-confirmed-link">
                      View Label
                    </a>
                  ) : (
                    '-'
                  )}
                </strong>
              </div>
            </div>
          </div>
        ) : (
          <div className="shipment-confirmed-fallback">
            <p>Shipment details are not available in this session, but your order list still has the latest created shipments.</p>
          </div>
        )}

        <div className="shipment-confirmed-notices">
          <div className="shipment-confirmed-notice shipment-confirmed-notice-warning shipment-confirmed-notice-red-text">
            <p>
              NOTE :- VERY HIGH VALUE SHIPMENT , PLEASE INSURE IT EXTERNALLY OUR QUOTATIONS DOESN'T
              INCLUDE INSUARANCE CHARGES , MAXIMUM LIABILITY TOWARDS ANY LOSS OR DAMAGE WILL BE
              LIMITED TO 100 USD ONLY FROM AWATMCLLC.
            </p>
          </div>
          <div className="shipment-confirmed-notice shipment-confirmed-notice-warning">
            <p>
              ALSO INFORM SHIPPER TO APPLY THE CORRECT LABELS ON ALL THE SIDES OF THE BOXES ,
              ATLEASE 1 COPIES ON EACH SIDE.
            </p>
          </div>
          <div className="shipment-confirmed-notice shipment-confirmed-notice-success shipment-confirmed-notice-red-text">
            <p>
              Dear Customer ,
              <br />
              Kindly confirm on the last page of self dispatch link option to get your shipment
              collected.
            </p>
          </div>
        </div>

        <div className="shipment-confirmed-actions">
          {orderId && (
            <Link
              to={`/orders/${orderId}`}
              state={{ order }}
              className="shipment-confirmed-btn shipment-confirmed-btn-primary"
            >
              View Shipment Details
            </Link>
          )}
          <Link to="/orders/list" className="shipment-confirmed-btn shipment-confirmed-btn-secondary">
            Go To Orders
          </Link>
          <Link to="/orders/create" className="shipment-confirmed-btn shipment-confirmed-btn-tertiary">
            Create Another Shipment
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ShipmentConfirmed;
