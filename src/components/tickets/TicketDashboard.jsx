import React, { useEffect, useState } from 'react';
import './TicketDashboard.css';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import TicketsTable from './TicketsTable';

const TicketDashboard = () => {
  const { isAdmin } = useAuth();
  const myRole = isAdmin ? 'admin' : 'user';

  const [activeTab, setActiveTab] = useState('user');
  const [ticketCounts, setTicketCounts] = useState({ user: 0, admin: 0 });
  const [ticketsRefreshKey, setTicketsRefreshKey] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    subcategory: '',
    awb: ''
  });

  const categories = ['Delivery', 'Billing', 'Technical', 'Other'];
  const subcategories = {
    Delivery: ['Delayed', 'Lost', 'Damaged'],
    Billing: ['Incorrect Charge', 'Refund', 'Invoice'],
    Technical: ['App Issue', 'Website Issue'],
    Other: ['General Inquiry']
  };

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const messagesEndRef = React.useRef(null);
  const [newMessage, setNewMessage] = useState('');
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [creatingTicket, setCreatingTicket] = useState(false);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

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

  const handleSendMessage = async () => {
    if (!newMessage && !file) return;

    try {
      setSending(true);

      const optimisticMessage = {
        message: newMessage || '',
        file_name: file?.name || null,
        file_url: null,
        sender_role: myRole,
        created_at: new Date().toISOString(),
        _optimistic: true
      };

      setMessages((prev) => [...prev, optimisticMessage]);
      setNewMessage('');
      setFile(null);

      const payload = new FormData();
      if (newMessage) payload.append('message', newMessage);
      if (file) payload.append('file', file);

      const res = await api.sendTicketMessage(selectedTicket.id, payload);

      if (!res.success) {
        throw new Error('Failed to send message');
      }

      setMessages((prev) => [
        ...prev.filter((message) => !message._optimistic),
        res.message
      ]);
    } catch (err) {
      console.error(err);
      alert('Failed to send message');
      setMessages((prev) => prev.filter((message) => !message._optimistic));
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

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setCreatingTicket(true);

      const payload = {
        awb_number: formData.awb,
        category: formData.category,
        subcategory: formData.subcategory
      };

      const res = await api.createTicket(payload);

      if (!res.success) {
        throw new Error(res.error || 'Failed to create ticket');
      }

      setIsModalOpen(false);
      setFormData({ category: '', subcategory: '', awb: '' });
      setTicketsRefreshKey((current) => current + 1);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to create ticket');
    } finally {
      setCreatingTicket(false);
    }
  };

  return (
    <div className="ticket-dashboard">
      <div className="dashboard-header">
        <h2>Ticket Dashboard</h2>
        <button className="create-btn" onClick={() => setIsModalOpen(true)}>Create Ticket</button>
      </div>

      <div className="tickets-tabs">
        <button
          className={`tickets-tab ${activeTab === 'user' ? 'active' : ''}`}
          onClick={() => setActiveTab('user')}
          type="button"
        >
          User Tickets ({ticketCounts.user})
        </button>
        <button
          className={`tickets-tab ${activeTab === 'admin' ? 'active' : ''}`}
          onClick={() => setActiveTab('admin')}
          type="button"
        >
          Admin Tickets ({ticketCounts.admin})
        </button>
      </div>

      <TicketsTable
        activeTab={activeTab}
        isAdmin={isAdmin}
        onViewTicket={handleViewTicket}
        onCountsChange={setTicketCounts}
        refreshKey={ticketsRefreshKey}
      />

      {isModalOpen && (
        <div className="app-modal-overlay">
          <div className="app-modal">
            <div className="app-modal-header">
              <h3 className="app-modal-title">Create New Ticket</h3>
              <button className="app-modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="app-modal-body">
              <div className="form-group">
                <label>Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => <option key={category} value={category}>{category}</option>)}
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
                  {formData.category && subcategories[formData.category].map((subcategory) => (
                    <option key={subcategory} value={subcategory}>{subcategory}</option>
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

              <div className="app-modal-footer">
                <button type="button" className="app-modal-secondary-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="app-modal-primary-btn" disabled={creatingTicket}>
                  {creatingTicket ? 'Creating...' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isViewModalOpen && selectedTicket && (
        <div className="app-modal-overlay app-modal-overlay--fullscreen">
          <div className="app-modal app-modal--fullscreen">
            <div className="app-modal-header">
              <h3 className="app-modal-title">Ticket Details</h3>
              <button
                className="app-modal-close"
                onClick={() => setIsViewModalOpen(false)}
              >
                &times;
              </button>
            </div>

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

            <div className="conversation-section">
              <h4>Conversation</h4>

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

              <div className="chat-input-bar">
                <label className="file-attach">
                  📎
                  <input
                    type="file"
                    hidden
                    onChange={(event) => setFile(event.target.files[0])}
                  />
                </label>

                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(event) => setNewMessage(event.target.value)}
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
