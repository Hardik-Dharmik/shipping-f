import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import './Home.css';
import { useAuth } from '../../contexts/AuthContext';

const POLL_INTERVAL_MS = 10000;

function formatDate(value) {
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
}

function NotificationCard({ item }) {
  const awbNumber = item?.data?.awb_number;
  const billingType = item?.data?.billing_type;
  const fileUrl = item?.data?.file_url;
  const ticketNumber = item?.data?.ticket_number;

  return (
    <article className="notification-card">
      <div className="notification-meta">
        <span className={`notification-pill ${item.type}`}>
          {item.type === 'billing_upload' ? 'Billing upload' : 'Ticket update'}
        </span>
        <span className="notification-time">{formatDate(item.created_at)}</span>
      </div>
      <h4 className="notification-title">{item.title}</h4>
      <p className="notification-body">{item.body}</p>
      <div className="notification-details">
        {awbNumber && (
          <span className="detail-item">AWB: {awbNumber}</span>
        )}
        {billingType && (
          <span className="detail-item">Type: {billingType}</span>
        )}
        {ticketNumber && (
          <span className="detail-item">Ticket #: {ticketNumber}</span>
        )}
      </div>
      {fileUrl && (
        <a className="notification-link" href={fileUrl} target="_blank" rel="noreferrer">
          View document
        </a>
      )}
    </article>
  );
}

function NotificationList({ items, emptyLabel }) {
  if (items.length === 0) {
    return <p className="notification-empty">{emptyLabel}</p>;
  }

  return (
    <div className="notification-list">
      {items.map((item) => (
        <NotificationCard key={item.id} item={item} />
      ))}
    </div>
  );
}

export default function Home() {
 const {isAdmin,isEmployee,canAccess} = useAuth();
 // This endpoint returns a combined feed with no documented permission filter.
 const canLoadFeed = !isEmployee || (canAccess('billing') && canAccess('tickets'));
 return (
   <>
     {isAdmin && <HomeAnalytics />}
     {canLoadFeed ? <NotificationFeed /> : <section className="home-notifications"><h2>Home</h2><p>Notification widgets require both Billing and Tickets access.</p></section>}
   </>
 );
}

const ANALYTICS_METRICS = [
  ['totalOrders', 'Total orders', 'All saved orders, across every status', 'orders'],
  ['totalCustomers', 'Total customers', 'Records in your shared directory', 'customers'],
  ['pendingKyc', 'Pending review', 'Submitted and awaiting verification', 'pending'],
  ['completedKyc', 'Completed', 'Required verification completed', 'completed'],
  ['notStartedKyc', 'Not started', 'Required verification not yet started', 'not-started'],
];

function AnalyticsIcon({ type }) {
  const paths = {
    orders: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="M3 8v9l9 5 9-5V8M12 13v9M7.5 5.5l9 5" /></>,
    customers: <><circle cx="9" cy="8" r="3" /><path d="M3 21v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M21 21v-2a6 6 0 0 0-4-5.65" /></>,
    pending: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    completed: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" /><path d="m8 12 3 3 5-6" /></>,
    'not-started': <><rect x="5" y="3" width="14" height="18" rx="3" /><path d="M9 8h6M9 12h6M9 16h3" /></>,
  };
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[type]}</svg>;
}

function AnalyticsCards({ metrics, data }) {
  return (
    <dl className="analytics-grid">
      {metrics.map(([key, label, description, type]) => (
        <div className={`analytics-card analytics-card--${type}`} key={key}>
          <dt><span>{label}</span><span className="analytics-icon"><AnalyticsIcon type={type} /></span></dt>
          <dd>{data[key]?.toLocaleString() ?? '—'}</dd>
          <dd className="analytics-description">{description}</dd>
        </div>
      ))}
    </dl>
  );
}

function HomeAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadAnalytics() {
      setLoading(true);
      setError('');
      try {
        const response = await api.getAnalytics();
        if (!response?.success || !response.data) {
          throw new Error('Unable to load analytics');
        }
        if (!cancelled) setData(response.data);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Unable to load analytics');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadAnalytics();
    return () => { cancelled = true; };
  }, [requestVersion]);

  return (
    <section className="home-notifications home-analytics" aria-labelledby="analytics-heading">
      <header className="home-header analytics-header">
        <div>
          <span className="analytics-eyebrow">Business overview</span>
          <h2 id="analytics-heading">Analytics</h2>
          <p>A snapshot of your orders, customers and verification status.</p>
        </div>
        <div className="analytics-toolbar">
        <span className="analytics-scope">All time · Global</span>
        <button className="refresh-btn" type="button" disabled={loading} onClick={() => setRequestVersion((value) => value + 1)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5" /><path d="M6 6a8 8 0 0 1 14 6M4 12a8 8 0 0 0 14 6" /></svg>
          Refresh
        </button>
        </div>
      </header>
      {loading ? (
        <div className="home-status" role="status">Loading analytics...</div>
      ) : error ? (
        <div className="home-status error" role="alert">
          <p>{error}</p>
          <button className="refresh-btn" type="button" onClick={() => setRequestVersion((value) => value + 1)}>Retry</button>
        </div>
      ) : (
        <>
          <AnalyticsCards metrics={ANALYTICS_METRICS.slice(0, 2)} data={data} />
          <div className="analytics-kyc">
            <div className="analytics-kyc-heading">
              <h3>KYC verification</h3>
              <p>Only accounts that require KYC</p>
            </div>
            <AnalyticsCards metrics={ANALYTICS_METRICS.slice(2)} data={data} />
          </div>
        </>
      )}
    </section>
  );
}

function NotificationFeed() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchNotifications = async () => {
    try {
      setError('');
      const response = await api.getNotifications();
      if (response?.success) {
        const items = Array.isArray(response.data) ? response.data : [];
        setNotifications(items);
        setLastUpdated(new Date());
      } else {
        setError('Failed to fetch notifications.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const billingNotifications = useMemo(
    () => notifications.filter((item) => item.type === 'billing_upload'),
    [notifications]
  );
  const ticketNotifications = useMemo(
    () =>
      notifications.filter((item) =>
        ['ticket_message', 'ticket_created'].includes(item.type)
      ),
    [notifications]
  );

  return (
    <section className="home-notifications">
      <header className="home-header">
        <div>
          <h2>Home</h2>
          <p>Live updates from billing uploads and ticket replies.</p>
        </div>
        <div className="home-refresh">
          <span className="last-updated">
            Last updated: {lastUpdated ? formatDate(lastUpdated) : '—'}
          </span>
          <button className="refresh-btn" onClick={fetchNotifications} type="button">
            Refresh
          </button>
        </div>
      </header>

      {loading ? (
        <div className="home-status">Loading notifications...</div>
      ) : error ? (
        <div className="home-status error">
          <p>{error}</p>
          <button className="refresh-btn" onClick={fetchNotifications} type="button">
            Retry
          </button>
        </div>
      ) : (
        <div className="notifications-grid">
          <div className="notifications-column">
            <div className="column-header">
              <h3>Billing uploads</h3>
              <span className="column-count">{billingNotifications.length}</span>
            </div>
            <NotificationList
              items={billingNotifications}
              emptyLabel="No billing upload notifications yet."
            />
          </div>
          <div className="notifications-column">
            <div className="column-header">
              <h3>Ticket replies</h3>
              <span className="column-count">{ticketNotifications.length}</span>
            </div>
            <NotificationList
              items={ticketNotifications}
              emptyLabel="No ticket reply notifications yet."
            />
          </div>
        </div>
      )}
    </section>
  );
}
