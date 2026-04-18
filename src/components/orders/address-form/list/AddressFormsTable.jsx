import { useNavigate } from 'react-router-dom';
import DataTable from '../../../common/DataTable';
import { extractAddressFormPayload } from '../../../../utils/addressForms';
import './AddressFormsList.css';

const DEFAULT_QUERY = {
  search: '',
  status: '',
  fromDate: '',
  toDate: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  page: 1,
  limit: 10
};

const ADDRESS_COLUMNS = [
  { key: 'code', label: 'Code', sortKey: 'code' },
  { key: 'status', label: 'Status', sortKey: 'status' },
  { key: 'pickup', label: 'Pickup', sortKey: 'pickupCountry' },
  { key: 'destination', label: 'Destination', sortKey: 'destinationCountry' },
  { key: 'submitted_at', label: 'Submitted At', sortKey: 'createdAt' },
  { key: 'action', label: 'Action' }
];

const formatDateTime = (value) => {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusClass = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'ordered') return 'status-ordered';
  if (normalized === 'submitted') return 'status-submitted';
  if (normalized === 'expired') return 'status-expired';
  return 'status-pending';
};

const canUseInOrder = (status) => String(status || '').toLowerCase() !== 'ordered';

const formatStatusLabel = (status, submitted) => {
  const resolvedStatus = status || (submitted ? 'Submitted' : 'Pending');
  return String(resolvedStatus).toUpperCase();
};

const compareValues = (left, right, sortOrder) => {
  if (left === right) return 0;
  if (left == null || left === '') return 1;
  if (right == null || right === '') return -1;

  const direction = sortOrder === 'asc' ? 1 : -1;

  if (left instanceof Date && right instanceof Date) {
    return (left.getTime() - right.getTime()) * direction;
  }

  return String(left).localeCompare(String(right), undefined, {
    numeric: true,
    sensitivity: 'base'
  }) * direction;
};

const normalizeAddressFormsResponse = (response, query) => {
  const payload = response?.data;
  const rawRows = Array.isArray(payload)
    ? payload
    : payload?.orders || payload?.items || payload?.results || response?.orders || [];

  let normalizedRows = rawRows.map((item) => {
    const form = extractAddressFormPayload(item);

    return {
      ...form,
      pickupCountry: form.pickupAddress.country || form.pickupAddress.city || form.pickupAddress.completeAddress,
      destinationCountry:
        form.destinationAddress.country || form.destinationAddress.city || form.destinationAddress.completeAddress
    };
  });

  if (query.search) {
    const normalizedSearch = query.search.toLowerCase();
    normalizedRows = normalizedRows.filter((form) =>
      [
        form.code,
        form.status,
        form.pickupAddress.country,
        form.pickupAddress.city,
        form.pickupAddress.completeAddress,
        form.destinationAddress.country,
        form.destinationAddress.city,
        form.destinationAddress.completeAddress
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch))
    );
  }

  if (query.status) {
    normalizedRows = normalizedRows.filter(
      (form) => String(form.status || '').toLowerCase() === String(query.status).toLowerCase()
    );
  }

  if (query.fromDate) {
    const fromDate = new Date(`${query.fromDate}T00:00:00`);
    normalizedRows = normalizedRows.filter((form) => new Date(form.createdAt) >= fromDate);
  }

  if (query.toDate) {
    const toDate = new Date(`${query.toDate}T23:59:59`);
    normalizedRows = normalizedRows.filter((form) => new Date(form.createdAt) <= toDate);
  }

  if (query.sortBy) {
    normalizedRows = [...normalizedRows].sort((leftForm, rightForm) => {
      const leftValue = query.sortBy === 'createdAt' ? new Date(leftForm.createdAt) : leftForm[query.sortBy];
      const rightValue = query.sortBy === 'createdAt' ? new Date(rightForm.createdAt) : rightForm[query.sortBy];
      return compareValues(leftValue, rightValue, query.sortOrder);
    });
  }

  const totalItems = normalizedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / query.limit));
  const currentPage = Math.min(query.page, totalPages);
  const startIndex = (currentPage - 1) * query.limit;

  return {
    rows: normalizedRows.slice(startIndex, startIndex + query.limit),
    totalItems,
    page: currentPage,
    limit: query.limit,
    totalPages
  };
};

function AddressFormsTable({ fetchForms }) {
  const navigate = useNavigate();

  const handleUseInOrder = (form) => {
    if (!form?.id) return;
    navigate(`/orders/create?addressFormId=${form.id}`);
  };

  return (
    <DataTable
      fetchData={fetchForms}
      normalizeResponse={normalizeAddressFormsResponse}
      columns={ADDRESS_COLUMNS}
      getRowKey={(address) => address.id || address.code}
      initialQuery={DEFAULT_QUERY}
      searchPlaceholder="Search by code, pickup, destination..."
      filterControls={[
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
      singularLabel="Address Form"
      pluralLabel="Address Forms"
      emptyMessage="No address forms found."
      errorMessage="Failed to load Address Forms"
      renderRow={(addressForm) => {
        const data = addressForm || {};
        const resolvedStatus = data.status || (data.submitted ? 'submitted' : 'pending');

        return (
          <>
            <td>{data.code || '-'}</td>
            <td>
              <span className={`status-label ${getStatusClass(resolvedStatus)}`}>
                {formatStatusLabel(data.status, data.submitted)}
              </span>
            </td>
            <td>{data.pickupCountry || '-'}</td>
            <td>{data.destinationCountry || '-'}</td>
            <td>{formatDateTime(data.submittedAt || data.createdAt)}</td>
            <td>
              {data.id && canUseInOrder(data.status) ? (
                <button
                  type="button"
                  className="address-form-action"
                  onClick={() => handleUseInOrder(data)}
                >
                  Use In Order
                </button>
              ) : (
                '-'
              )}
            </td>
          </>
        );
      }}
    />
  );
}

export default AddressFormsTable;
