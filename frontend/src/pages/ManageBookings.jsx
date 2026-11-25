import { useEffect, useState } from "react";

import {
  getAllBookings,
  approveBooking,
  rejectBooking,
} from "../api/bookings.api";

import { getResources } from "../api/resources.api";

export default function ManageBookings() {
  const [bookings, setBookings] = useState([]);
  const [resources, setResources] = useState([]);

  const [status, setStatus] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [rejectingId, setRejectingId] = useState(null);
  const [decisionNote, setDecisionNote] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadResources() {
      try {
        const result = await getResources({ pageSize: 100 });
        setResources(result.data);
      } catch (err) {
        setError(err.message);
      }
    }

    loadResources();
  }, []);

  async function loadBookings() {
    try {
      setLoading(true);
      setError("");

      const result = await getAllBookings({
        status,
        resourceId,
        from: from ? new Date(`${from}T00:00:00`).toISOString() : "",
        to: to ? new Date(`${to}T23:59:59.999`).toISOString() : "",
        page,
        pageSize: 10,
      });

      setBookings(result.data);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, [status, resourceId, from, to, page]);

  function getResourceName(id) {
    const resource = resources.find((item) => item.id === id);

    return resource ? resource.name : id;
  }

  function resetFilters() {
    setStatus("");
    setResourceId("");
    setFrom("");
    setTo("");
    setPage(1);
  }

  async function handleApprove(id) {
    if (!window.confirm("Approve this booking?")) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await approveBooking(id);

      setMessage("Booking approved successfully.");
      await loadBookings();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleReject(e, id) {
    e.preventDefault();

    const note = decisionNote.trim();

    if (note.length < 5 || note.length > 200) {
      setError("Rejection note must contain 5 to 200 characters.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await rejectBooking(id, note);

      setMessage("Booking rejected successfully.");
      setRejectingId(null);
      setDecisionNote("");

      await loadBookings();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="manage-bookings-page">
      <h1>Manage Bookings</h1>
      <p>Review and manage resource booking requests.</p>

      {error && <p className="resource-error">{error}</p>}
      {message && <p className="resource-success">{message}</p>}

      <div className="resource-panel">
        <h2>Filters</h2>

        <div className="admin-booking-filters">
          <label className="resource-field">
            Status
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </label>

          <label className="resource-field">
            Resource
            <select
              value={resourceId}
              onChange={(e) => {
                setResourceId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Resources</option>

              {resources.map((resource) => (
                <option key={resource.id} value={resource.id}>
                  {resource.name}
                </option>
              ))}
            </select>
          </label>

          <label className="resource-field">
            From Date
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
            />
          </label>

          <label className="resource-field">
            To Date
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
            />
          </label>
        </div>

        <button className="back-button" onClick={resetFilters}>
          Clear Filters
        </button>
      </div>

      <div className="resource-panel">
        <h2>All Bookings</h2>

        {loading ? (
          <p>Loading bookings...</p>
        ) : bookings.length === 0 ? (
          <p>No bookings found.</p>
        ) : (
          <div className="booking-list">
            {bookings.map((booking) => {
              const canReview =
                booking.status === "PENDING" &&
                new Date(booking.startTime) > new Date();

              return (
                <div className="booking-card" key={booking.id}>
                  <h3>{getResourceName(booking.resourceId)}</h3>

                  <p>
                    Status: <strong>{booking.status}</strong>
                  </p>

                  <p>User ID: {booking.userId}</p>

                  <p>Start: {new Date(booking.startTime).toLocaleString()}</p>

                  <p>End: {new Date(booking.endTime).toLocaleString()}</p>

                  <p>Purpose: {booking.purpose}</p>

                  {booking.ticketId && <p>Ticket ID: {booking.ticketId}</p>}

                  {booking.decisionNote && (
                    <p>Decision Note: {booking.decisionNote}</p>
                  )}

                  {canReview && (
                    <div className="admin-resource-actions">
                      <button
                        className="resource-button"
                        disabled={saving}
                        onClick={() => handleApprove(booking.id)}
                      >
                        Approve
                      </button>

                      <button
                        className="back-button"
                        disabled={saving}
                        onClick={() => {
                          setRejectingId(booking.id);
                          setDecisionNote("");
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {canReview && rejectingId === booking.id && (
                    <form
                      className="resource-form"
                      onSubmit={(e) => handleReject(e, booking.id)}
                    >
                      <label className="resource-field">
                        Rejection Note
                        <textarea
                          value={decisionNote}
                          onChange={(e) => setDecisionNote(e.target.value)}
                          placeholder="Enter reason for rejection"
                          minLength={5}
                          maxLength={200}
                          required
                        />
                      </label>

                      <div className="admin-resource-actions">
                        <button
                          className="resource-button"
                          type="submit"
                          disabled={saving}
                        >
                          Confirm Rejection
                        </button>

                        <button
                          className="back-button"
                          type="button"
                          disabled={saving}
                          onClick={() => {
                            setRejectingId(null);
                            setDecisionNote("");
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="resource-pagination">
          <button
            disabled={page <= 1 || loading}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>

          <span>
            Page {page} of {Math.max(totalPages, 1)}
          </span>

          <button
            disabled={page >= totalPages || loading}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
