import { useEffect, useState } from 'react';

import {
  getMyBookings,
  cancelBooking,
} from '../api/bookings.api';

import { getResourceById } from '../api/resources.api';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [resourceNames, setResourceNames] = useState({});

  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [message, setMessage] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;

    async function fetchBookings() {
      try {
        setLoading(true);
        setError('');

        const result = await getMyBookings({
          status,
          page,
          pageSize: 10,
        });

        if (!active) return;

        if (page > Math.max(1, result.totalPages)) {
          setPage(Math.max(1, result.totalPages));
          return;
        }

        setBookings(result.data);
        setTotalPages(result.totalPages);

        const resourceIds = [
          ...new Set(
            result.data.map((booking) => booking.resourceId)
          ),
        ];

        const entries = await Promise.all(
          resourceIds.map(async (id) => {
            try {
              const resource = await getResourceById(id);

              return [id, resource.name];
            } catch {
              return [id, id];
            }
          })
        );

        if (active) {
          setResourceNames(Object.fromEntries(entries));
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchBookings();

    return () => {
      active = false;
    };
  }, [status, page, refresh]);

  async function handleCancel(id) {
    const confirmed = window.confirm(
      'Are you sure you want to cancel this booking?'
    );

    if (!confirmed) return;

    try {
      setCancelling(id);
      setActionError('');
      setMessage('');

      await cancelBooking(id);

      setMessage('Booking cancelled successfully.');
      setRefresh((prev) => prev + 1);
    } catch (err) {
      setActionError(err.message || 'Cancellation failed.');
    } finally {
      setCancelling(null);
    }
  }

  return (
    <div className="my-bookings-page">
      <h1>My Bookings</h1>
      <p>View and manage your resource bookings.</p>

      <div className="resource-filters">
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
      </div>

      {message && (
        <p className="resource-success">{message}</p>
      )}

      {actionError && (
        <p className="resource-error">{actionError}</p>
      )}

      {loading ? (
        <p>Loading bookings...</p>
      ) : error ? (
        <p className="resource-error">{error}</p>
      ) : bookings.length === 0 ? (
        <p>No bookings found.</p>
      ) : (
        <>
          <div className="booking-list">
            {bookings.map((booking) => {
              const canCancel =
                ['PENDING', 'APPROVED'].includes(
                  booking.status
                ) &&
                new Date(booking.startTime) > new Date();

              return (
                <div
                  className="resource-panel"
                  key={booking.id}
                >
                  <div className="booking-header">
                    <h3>
                      {resourceNames[booking.resourceId] ||
                        booking.resourceId}
                    </h3>

                    <span
                      className={`booking-status ${booking.status.toLowerCase()}`}
                    >
                      {booking.status}
                    </span>
                  </div>

                  <p>
                    Start:{' '}
                    {new Date(
                      booking.startTime
                    ).toLocaleString()}
                  </p>

                  <p>
                    End:{' '}
                    {new Date(
                      booking.endTime
                    ).toLocaleString()}
                  </p>

                  <p>Purpose: {booking.purpose}</p>

                  {booking.ticketId && (
                    <p>Ticket: {booking.ticketId}</p>
                  )}

                  {booking.decisionNote && (
                    <p>Decision: {booking.decisionNote}</p>
                  )}

                  {canCancel && (
                    <button
                      className="cancel-booking-button"
                      disabled={cancelling !== null}
                      onClick={() =>
                        handleCancel(booking.id)
                      }
                    >
                      {cancelling === booking.id
                        ? 'Cancelling...'
                        : 'Cancel Booking'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="resource-pagination">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>

            <span>
              Page {page} of {totalPages}
            </span>

            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}