
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getTicketDetail,
  updateTicket,
} from '../api/tickets.api';

function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [events, setEvents] = useState([]);
  const [draft, setDraft] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError('');

        const result = await getTicketDetail(id);

        setTicket(result.ticket);
        setEvents(result.events);

        setDraft({
          category: result.ticket.category,
          priority: result.ticket.priority,
          status: result.ticket.status,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setDraft((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    const updates = {};

    if (draft.category !== ticket.category) {
      updates.category = draft.category;
    }

    if (draft.priority !== ticket.priority) {
      updates.priority = draft.priority;
    }

    if (draft.status !== ticket.status) {
      updates.status = draft.status;
    }

    if (Object.keys(updates).length === 0) {
      setMessage('No changes to save.');
      return;
    }

    // Keep previous values for rollback
    const previousTicket = ticket;
    const previousEvents = events;
    const previousDraft = { ...draft };

    try {
      setSaving(true);
      setError('');
      setMessage('');

      // Optimistic update
      setTicket((prev) => ({
        ...prev,
        ...updates,
        ...(updates.category
          ? { isHumanOverride: true }
          : {}),
        ...(
          updates.category ||
          (updates.status && previousTicket.status === 'OPEN')
            ? { isReviewed: true }
            : {}
        ),
      }));

      const result = await updateTicket(id, updates);

      // Replace optimistic data with backend response
      setTicket(result.ticket);
      setEvents(result.events);

      setDraft({
        category: result.ticket.category,
        priority: result.ticket.priority,
        status: result.ticket.status,
      });

      setMessage('Ticket updated successfully.');
    } catch (err) {
      // Rollback if API request fails
      setTicket(previousTicket);
      setEvents(previousEvents);
      setDraft(previousDraft);

      setError(err.message || 'Failed to update ticket.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p>Loading ticket details...</p>;
  }

  if (error && !ticket) {
    return <p className="error-message">{error}</p>;
  }

  if (!ticket || !draft) {
    return <p>Ticket not found.</p>;
  }

  return (
    <div className="ticket-detail-page">

      <button
        className="back-button"
        onClick={() => navigate('/triage')}
      >
        ← Back to Triage Queue
      </button>

      <div className="ticket-detail-header">
        <div>
          <h1>Ticket Details</h1>
          <p>{ticket.externalId}</p>
        </div>
      </div>

      {message && (
        <p className="success-message">{message}</p>
      )}

      {error && (
        <p className="error-message">{error}</p>
      )}

      <section className="ticket-detail-card">

        <div className="ticket-subject">
          <h2>{ticket.subject}</h2>
          <span>{ticket.externalId}</span>
        </div>

        <div className="ticket-description">
          <h3>Description</h3>
          <p>{ticket.body}</p>
        </div>

        <div className="ticket-metadata">
          <p>
            <strong>Auto Category:</strong>
            {ticket.autoCategory}
          </p>

          <p>
            <strong>Human Override:</strong>
            {ticket.isHumanOverride ? 'Yes' : 'No'}
          </p>

          <p>
            <strong>Reviewed:</strong>
            {ticket.isReviewed ? 'Yes' : 'No'}
          </p>

          <p>
            <strong>Created:</strong>
            {new Date(ticket.createdAt).toLocaleString()}
          </p>

          <p>
            <strong>Updated:</strong>
            {new Date(ticket.updatedAt).toLocaleString()}
          </p>
        </div>

      </section>

      <section className="agent-review-card">
        <h2>Agent Review</h2>
        <p>Review and update the ticket classification and status.</p>

        <div className="review-fields">

          <div className="review-field">
            <label htmlFor="category">Category</label>

            <select
              id="category"
              name="category"
              value={draft.category}
              onChange={handleChange}
            >
              <option value="BILLING">Billing</option>
              <option value="BUG">Bug</option>
              <option value="FEATURE_REQUEST">Feature Request</option>
              <option value="LOGIN">Login</option>
              <option value="DELIVERY">Delivery</option>
            </select>
          </div>

          <div className="review-field">
            <label htmlFor="priority">Priority</label>

            <select
              id="priority"
              name="priority"
              value={draft.priority}
              onChange={handleChange}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <div className="review-field">
            <label htmlFor="status">Status</label>

            <select
              id="status"
              name="status"
              value={draft.status}
              onChange={handleChange}
            >
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

        </div>

        <button
          className="save-review-button"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Review'}
        </button>
      </section>

      <section className="ticket-audit-section">
        <h2>Audit History</h2>

        {events.length === 0 ? (
          <p>No audit history available.</p>
        ) : (
          <div className="ticket-audit-list">

            {events.map((event) => (
              <div
                key={event.id}
                className="ticket-audit-item"
              >
                <div>
                  <strong>
                    {event.field.toUpperCase()} UPDATED
                  </strong>

                  <p>
                    {String(event.oldValue ?? 'None')}
                    {' → '}
                    {String(event.newValue ?? 'None')}
                  </p>
                </div>

                <div className="audit-meta">
                  <span>By: {event.actor}</span>
                  <span>
                    {new Date(event.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}

          </div>
        )}
      </section>

    </div>
  );
}

export default TicketDetail;
