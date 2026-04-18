import { Link } from 'react-router-dom';
import DataTable from '../../common/DataTable';
import { formatCurrency } from '../../../utils/currency';

const DEFAULT_QUERY = {
  search: '',
  carrier: '',
  fromDate: '',
  toDate: '',
  sortBy: 'created_at',
  sortOrder: 'desc',
  page: 1,
  limit: 10
};

const CARRIER_OPTIONS = [
  { value: '', label: 'All Carriers' },
  { value: 'DHL', label: 'DHL' },
  { value: 'FedEx', label: 'FedEx' },
  { value: 'UPS', label: 'UPS' }
];

const ORDER_COLUMNS = [
  { key: 'awb', label: 'AWB', sortKey: 'awb_number' },
  { key: 'carrier', label: 'Carrier' },
  { key: 'route', label: 'Route' },
  { key: 'weight', label: 'Weight' },
  { key: 'shipmentValue', label: 'Shipment Value' },
  { key: 'cost', label: 'Cost' },
  { key: 'status', label: 'Status', sortKey: 'status' },
  { key: 'created', label: 'Created', sortKey: 'created_at' },
  { key: 'awbLabel', label: 'AWB Label' },
  { key: 'details', label: 'Details' }
];

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

const normalizeOrdersResponse = (response, query) => {
  const payload = response?.data;
  const rows = Array.isArray(payload)
    ? payload
    : payload?.orders || payload?.items || payload?.results || response?.orders || [];

  const pagination = payload?.pagination || response?.pagination || {};
  const totalItemsRaw =
    pagination.totalItems ??
    pagination.total ??
    pagination.count ??
    payload?.totalItems ??
    payload?.total ??
    response?.total ??
    rows.length;
  const currentPageRaw = pagination.page ?? payload?.page ?? query.page;
  const limitRaw = pagination.limit ?? payload?.limit ?? query.limit;
  const totalPagesRaw =
    pagination.totalPages ??
    payload?.totalPages ??
    Math.max(1, Math.ceil((Number(totalItemsRaw) || rows.length) / (Number(limitRaw) || query.limit || 1)));

  return {
    rows,
    totalItems: Number(totalItemsRaw) || rows.length,
    page: Number(currentPageRaw) || query.page,
    limit: Number(limitRaw) || query.limit,
    totalPages: Number(totalPagesRaw) || 1
  };
};

function OrdersTable({
  fetchOrders,
  detailsPathBuilder,
  detailsStateBuilder,
  emptyMessage = 'No orders found.'
}) {
  return (
    <DataTable
      fetchData={fetchOrders}
      normalizeResponse={normalizeOrdersResponse}
      columns={ORDER_COLUMNS}
      getRowKey={(order) => order.id}
      initialQuery={DEFAULT_QUERY}
      searchPlaceholder="Search by AWB, carrier, route..."
      filterControls={[
        {
          key: 'carrier',
          label: 'Carrier',
          options: CARRIER_OPTIONS
        },
        {
          key: 'fromDate',
          label: 'From Date',
          type: 'date',
          maxKey: 'toDate'
        },
        {
          key: 'toDate',
          label: 'To Date',
          type: 'date',
          minKey: 'fromDate'
        }
      ]}
      singularLabel="Order"
      pluralLabel="Orders"
      emptyMessage={emptyMessage}
      errorMessage="Failed to load orders"
      renderRow={(order) => {
        const data = order.order_data || {};

        return (
          <>
            <td className="awb">{order.awb_number || '-'}</td>
            <td>{order.carrier?.name || '-'}</td>
            <td>
              {data.pickup?.country || '-'} {'->'} {data.destination?.country || '-'}
            </td>
            <td>
              {data.weight?.chargeable ?? '-'} {data.weight?.unit || ''}
            </td>
            <td>{formatCurrency(data.shipmentValue?.value || 0)}</td>
            <td>{formatCurrency(order.carrier?.cost || 0)}</td>
            <td>
              <span className={`status-badge ${getStatusClass(order.status)}`}>
                {order.status || 'Pending'}
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
            <td>
              <Link
                to={detailsPathBuilder(order)}
                state={detailsStateBuilder ? detailsStateBuilder(order) : { order }}
                className="details-link"
              >
                View
              </Link>
            </td>
          </>
        );
      }}
    />
  );
}

export default OrdersTable;
