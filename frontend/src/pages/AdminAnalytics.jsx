import { useEffect, useState } from "react";
import { getAdminStats } from "../api/stats.api";

export default function AdminAnalytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        setError("");

        const result = await getAdminStats();
        setStats(result);
      } catch (err) {
        setError(err.message || "Failed to load analytics.");
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  if (loading) return <p>Loading analytics...</p>;

  if (error) {
    return <p className="resource-error">{error}</p>;
  }

  if (!stats) {
    return <p>No analytics available.</p>;
  }

  const { activeResources, bookingsByStatus, topResources, ticketStats } =
    stats;

  const totalBookings = Object.values(bookingsByStatus).reduce(
    (total, count) => total + count,
    0,
  );

  const pendingBookings = bookingsByStatus.PENDING;
  const approvedBookings = bookingsByStatus.APPROVED;
  const rejectedBookings = bookingsByStatus.REJECTED;
  const cancelledBookings = bookingsByStatus.CANCELLED;

  const totalTickets = Object.values(ticketStats.byStatus).reduce(
    (total, count) => total + count,
    0,
  );

  return (
    <div className="admin-analytics-page">
      <h1>Admin Analytics</h1>
      <p>Overview of resources and booking activity.</p>

      {/* Resource Overview */}
      <div className="resource-panel">
        <h2>Resource Overview</h2>

        <div className="analytics-grid">
          <div className="analytics-card">
            <p>Active Resources</p>
            <h2>{activeResources}</h2>
          </div>
        </div>
      </div>

      {/* Booking Overview */}
      <div className="resource-panel">
        <h2>Booking Overview</h2>

        <div className="analytics-grid">
          <div className="analytics-card">
            <p>Total Bookings</p>
            <h2>{totalBookings}</h2>
          </div>

          <div className="analytics-card">
            <p>Pending</p>
            <h2>{pendingBookings}</h2>
          </div>

          <div className="analytics-card">
            <p>Approved</p>
            <h2>{approvedBookings}</h2>
          </div>

          <div className="analytics-card">
            <p>Rejected</p>
            <h2>{rejectedBookings}</h2>
          </div>

          <div className="analytics-card">
            <p>Cancelled</p>
            <h2>{cancelledBookings}</h2>
          </div>
        </div>
      </div>

      {/* Top Resources */}
      <div className="resource-panel">
        <h2>Top Resources</h2>

        {topResources.length === 0 ? (
          <p>No resource booking activity available.</p>
        ) : (
          <div className="analytics-grid">
            {topResources.map((resource) => (
              <div className="analytics-card" key={resource.resourceId}>
                <p>{resource.name}</p>
                <h2>{resource.bookingCount}</h2>
                <p>{resource.type} | Bookings</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ticket Statistics */}
      <div className="resource-panel">
        <h2>Ticket Statistics</h2>

        <div className="analytics-grid">
          <div className="analytics-card">
            <p>Total Tickets</p>
            <h2>{totalTickets}</h2>
          </div>

          <div className="analytics-card">
            <p>Reviewed Tickets</p>
            <h2>{ticketStats.reviewedCount}</h2>
          </div>

          <div className="analytics-card">
            <p>Model Agreement Rate</p>
            <h2>{ticketStats.modelAgreementRate}%</h2>
          </div>

          <div className="analytics-card">
            <p>Open Tickets</p>
            <h2>{ticketStats.byStatus.OPEN}</h2>
          </div>

          <div className="analytics-card">
            <p>In Progress</p>
            <h2>{ticketStats.byStatus.IN_PROGRESS}</h2>
          </div>

          <div className="analytics-card">
            <p>Resolved Tickets</p>
            <h2>{ticketStats.byStatus.RESOLVED}</h2>
          </div>

          <div className="analytics-card">
            <p>Closed Tickets</p>
            <h2>{ticketStats.byStatus.CLOSED}</h2>
          </div>
        </div>
      </div>
    </div>
  );
}
