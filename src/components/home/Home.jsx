import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import './Home.css';

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
