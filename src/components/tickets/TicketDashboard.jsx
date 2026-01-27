import React, { useEffect, useState } from 'react';
import './TicketDashboard.css';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const TicketDashboard = () => {
    const { isAdmin } = useAuth();
const myRole = isAdmin ? 'admin' : 'user';

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    subcategory: '',
    awb: ''
  });

  const categories = ['Delivery', 'Billing', 'Technical', 'Other'];
  const subcategories = {
    'Delivery': ['Delayed', 'Lost', 'Damaged'],
    'Billing': ['Incorrect Charge', 'Refund', 'Invoice'],
    'Technical': ['App Issue', 'Website Issue'],
    'Other': ['General Inquiry']
  };

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

    const messagesEndRef = React.useRef(null);

useEffect(() => {
  if (messagesEndRef.current) {
    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }
}, [messages]);

const [newMessage, setNewMessage] = useState('');
const [file, setFile] = useState(null);
const [sending, setSending] = useState(false);

const handleSendMessage = async () => {
  if (!newMessage && !file) return;

  try {
    setSending(true);

    // Optimistic message WITH sender_role
    const optimisticMessage = {
      message: newMessage || '',
      file_name: file?.name || null,
      file_url: null,
      sender_role: myRole, // ✅ IMPORTANT
      created_at: new Date().toISOString(),
      _optimistic: true
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage('');
    setFile(null);

    const formData = new FormData();
    if (newMessage) formData.append('message', newMessage);
    if (file) formData.append('file', file);

    const res = await api.sendTicketMessage(selectedTicket.id, formData);

    if (!res.success) {
      throw new Error('Failed to send message');
    }

    // Replace optimistic message with real one
    setMessages((prev) => [
      ...prev.filter((m) => !m._optimistic),
      res.message
    ]);

  } catch (err) {
    console.error(err);
    alert('Failed to send message');

    // rollback optimistic message
    setMessages((prev) => prev.filter((m) => !m._optimistic));
  } finally {
    setSending(false);
  }
};




  const fetchTicketMessages = async (ticketId) => {
        try {
            setMessagesLoading(true);
            const res = await api.getTicketMessages(ticketId);

            if (res.success) {
                setMessages(res.messages || []);
            } else {
                setMessages([]);
            }
        } catch (err) {
            console.error(err);
            setMessages([]);
        } finally {
            setMessagesLoading(false);
        }
    };

    const handleViewTicket = (ticket) => {
        setSelectedTicket(ticket);
        setIsViewModalOpen(true);
        fetchTicketMessages(ticket.id);
    };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    setLoading(true);

    const payload = {
      awb_number: formData.awb,
      category: formData.category,
      subcategory: formData.subcategory
    };

    const res = await api.createTicket(payload);

    if (!res.success) {
      throw new Error(res.error || 'Failed to create ticket');
    }

    // Close modal
    setIsModalOpen(false);
    setFormData({ category: '', subcategory: '', awb: '' });

    // Refresh tickets
    await fetchTickets();

    // OPTIONAL: auto-open ticket
    // handleViewTicket(res.data);

  } catch (err) {
    console.error(err);
    alert(err.message || 'Failed to create ticket');
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

  useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
        setLoading(true);
        setError('');
        const response = await api.getUserTickets();

        if (response.success) {
            setTickets(response.data || []);
        } else {
            setError('Failed to fetch tickets');
        }
        } catch (err) {
        console.error(err);
        setError('Failed to load tickets');
        toast.error('Failed to load tickets');
        } finally {
        setLoading(false);
        }
    };

  return (
    <div className="ticket-dashboard">
      <div className="dashboard-header">
        <h2>Ticket Dashboard</h2>
        <button className="create-btn" onClick={() => setIsModalOpen(true)}>Create Ticket</button>
      </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading tickets...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p className="error-message">{error}</p>
            <button onClick={fetchTickets} className="btn-retry">Retry</button>
          </div>
        ) : tickets.length === 0 ? (
          <div className="empty-state">
            <p>No tickets found.</p>
          </div>
        ) 
      :(<div className="tickets-table-container">
        <table className="tickets-table">
          <thead>
            <tr>
              <th>AWB Number</th>
              <th>User</th>
              <th>Category</th>
              <th>Subcategory</th>
              <th>Status</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => {
                const unreadCount = isAdmin
                ? ticket.unread_admin_count
                : ticket.unread_user_count;
                return (
              <tr key={ticket.id}>
                <td>{ticket.awb_number}</td>
                <td>{ticket.username}</td>
                <td>{ticket.category}</td>
                <td>{ticket.subcategory}</td>
                <td>
                  <span className={`status-badge ${ticket.status.toLowerCase()}`}>
                    {ticket.status}
                  </span>
                </td>
                <td>{formatDate(ticket.created_at)}</td>
                <td>
                    <button
                        className="view-btn"
                        onClick={() => handleViewTicket(ticket)}
                    >
                        View
                        {unreadCount > 0 && (
                            <span className="unread-badge">{unreadCount}</span>
                        )}
                    </button>
                </td>

              </tr>
            )
            })}
          </tbody>
        </table>
      </div>)}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create New Ticket</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Category</label>
                <select 
                  name="category" 
                  value={formData.category} 
                  onChange={handleInputChange} 
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Subcategory</label>
                <select 
                  name="subcategory" 
                  value={formData.subcategory} 
                  onChange={handleInputChange} 
                  required
                  disabled={!formData.category}
                >
                  <option value="">Select Subcategory</option>
                  {formData.category && subcategories[formData.category].map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>AWB Number</label>
                <input 
                  type="text"
                  name="awb" 
                  value={formData.awb} 
                  onChange={handleInputChange} 
                  required
                  placeholder="Enter AWB Number"
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
<button type="submit" className="submit-btn" disabled={loading}>
  {loading ? 'Creating...' : 'Create Ticket'}
</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isViewModalOpen && selectedTicket && (
  <div className="modal-overlay full-screen">
    <div className="modal-content full-screen-content">

      {/* Header */}
      <div className="modal-header">
        <h3>Ticket Details</h3>
        <button
          className="close-btn"
          onClick={() => setIsViewModalOpen(false)}
        >
          &times;
        </button>
      </div>

      {/* Ticket Info */}
      <div className="ticket-details">
        <div><strong>AWB:</strong> {selectedTicket.awb_number}</div>
        <div><strong>Category:</strong> {selectedTicket.category}</div>
        <div><strong>Subcategory:</strong> {selectedTicket.subcategory}</div>
        <div>
          <strong>Status:</strong>{' '}
          <span className={`status-badge ${selectedTicket.status}`}>
            {selectedTicket.status}
          </span>
        </div>
        <div>
          <strong>Created:</strong>{' '}
          {formatDate(selectedTicket.created_at)}
        </div>
      </div>

      {/* Conversation */}
      <div className="conversation-section">
  <h4>Conversation</h4>

  {/* Messages area */}
  <div className="messages-list">
    {messagesLoading ? (
      <p>Loading messages...</p>
    ) : messages.length === 0 ? (
      <p className="no-messages">No messages yet.</p>
    ) : (
      messages.map((msg) => {
const isMine = msg.sender_role === myRole;

        return (
          <div key={msg.id} className={`chat-row ${isMine ? 'right' : 'left'}`}>
  <div className={`chat-bubble ${isMine ? 'mine' : 'theirs'}`}>
              {msg.message && (
                <div className="chat-text">{msg.message}</div>
              )}

              {msg.file_url && (
                <a
                  href={msg.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="chat-file"
                >
                  📎 {msg.file_name}
                </a>
              )}

              <div className="chat-time">
                {formatDate(msg.created_at)}
              </div>
            </div>
          </div>
        );
      })
    )}

    <div ref={messagesEndRef} />
  </div>

  {/* Selected file preview */}
  {file && (
    <div className="selected-file">
      <span className="file-name">📎 {file.name}</span>
      <button
        className="remove-file"
        onClick={() => setFile(null)}
        type="button"
      >
        ✕
      </button>
    </div>
  )}

  {/* Chat input — ALWAYS visible */}
  <div className="chat-input-bar">
    <label className="file-attach">
      📎
      <input
        type="file"
        hidden
        onChange={(e) => setFile(e.target.files[0])}
      />
    </label>

    <input
      type="text"
      placeholder="Type a message..."
      value={newMessage}
      onChange={(e) => setNewMessage(e.target.value)}
      disabled={sending}
    />

    <button
      className="send-btn"
      onClick={handleSendMessage}
      disabled={sending || (!newMessage && !file)}
    >
      {sending ? '...' : 'Send'}
    </button>
  </div>
</div>


    </div>
  </div>
)}

    </div>
  );
};

export default TicketDashboard;
