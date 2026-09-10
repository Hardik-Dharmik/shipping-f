import { Link } from 'react-router-dom';
const options = [['requireBOE', 'Require BOE'], ['requireDO', 'Require D/O'], ['exportDeclaration', 'Export Declaration'], ['dutyExemption', 'Duty Exemption'], ['temporaryExportForRepairAndReturn', 'Temporary Export For Repair And Return'], ['insurance', 'Shipment Insurance']];
export default function ManualOrderDetails({ order, showBackLink }) {
  const data = order.order_data;
  return <div className="order-details-page"><div className="order-details-container">
    <div className="order-details-header"><h1>Order Details</h1>{showBackLink && <Link to="/orders/list">Back to Orders</Link>}</div>
    <div className="order-details-grid">
      <section className="details-card"><h3>Summary</h3>
        <p>AWB: {order.awb_number}</p><p>Customer: {order.customer?.company_name || order.customer_id}</p>
        <p>Agent: {data.agentName}</p><p>Created: {new Date(order.created_at).toLocaleString()}</p>
        <a href={order.awb_pdf_url} target="_blank" rel="noopener noreferrer">View AWB PDF</a>
      </section>
      {['pickup', 'destination', 'packaging'].map(section => <section className="details-card" key={section}>
        <h3 style={{ textTransform: 'capitalize' }}>{section}</h3>
        {data.screenshots?.[section]?.url && <a href={data.screenshots[section].url} target="_blank" rel="noopener noreferrer"><img src={data.screenshots[section].url} alt={`${section} screenshot`} style={{ width: '100%', maxHeight: 360, objectFit: 'contain' }} /></a>}
      </section>)}
      <section className="details-card"><h3>Other documents</h3>
        {data.otherDocuments?.length ? data.otherDocuments.map((doc, index) => <p key={index}><a href={doc.url} target="_blank" rel="noopener noreferrer">{doc.documentName}</a></p>) : <p>No other documents</p>}
      </section>
      <section className="details-card"><h3>Compliance &amp; Declarations</h3>{options.map(([key, label]) => <p key={key}>{label}: {data.compliance?.[key] ? 'Yes' : 'No'}</p>)}</section>
    </div>
  </div></div>;
}
