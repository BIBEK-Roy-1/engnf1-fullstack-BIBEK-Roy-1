import { useEffect, useState } from "react";
import { getResources } from "../api/resources.api";
import { getAllBookings } from "../api/bookings.api";

export default function AdminAnalytics() {
  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        setError("");

        const resourceResult = await getResources({
          page: 1,
          pageSize: 100,
        });

        const bookingResult = await getAllBookings({
          page: 1,
          pageSize: 100,
        });

        let allResources = [...resourceResult.data];
        let allBookings = [...bookingResult.data];

        for (let page = 2; page <= resourceResult.totalPages; page++) {
          const result = await getResources({ page, pageSize: 100 });
          allResources.push(...result.data);
        }

        for (let page = 2; page <= bookingResult.totalPages; page++) {
          const result = await getAllBookings({ page, pageSize: 100 });
          allBookings.push(...result.data);
        }

        setResources(allResources);
        setBookings(allBookings);
      } catch (err) {
        setError(err.message || "Failed to load analytics.");
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  const totalResources = resources.length;

  const activeResources = resources.filter(
    (resource) => resource.isActive,
  ).length;

  const inactiveResources = totalResources - activeResources;

  const totalBookings = bookings.length;

  const pendingBookings = bookings.filter(
    (booking) => booking.status === "PENDING",
  ).length;

  const approvedBookings = bookings.filter(
    (booking) => booking.status === "APPROVED",
  ).length;

  const rejectedBookings = bookings.filter(
    (booking) => booking.status === "REJECTED",
  ).length;

  const cancelledBookings = bookings.filter(
    (booking) => booking.status === "CANCELLED",
  ).length;

  if (loading) return <p>Loading analytics...</p>;

  if (error) {
    return <p className="resource-error">{error}</p>;
  }

  return (
    <div className="admin-analytics-page">
      <h1>Admin Analytics</h1>
      <p>Overview of resources and booking activity.</p>

      <div className="resource-panel">
        <h2>Resource Overview</h2>

        <div className="analytics-grid">
          <div className="analytics-card">
            <p>Total Resources</p>
            <h2>{totalResources}</h2>
          </div>

          <div className="analytics-card">
            <p>Active Resources</p>
            <h2>{activeResources}</h2>
          </div>

          <div className="analytics-card">
            <p>Inactive Resources</p>
            <h2>{inactiveResources}</h2>
          </div>
        </div>
      </div>

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
    </div>
  );
}
