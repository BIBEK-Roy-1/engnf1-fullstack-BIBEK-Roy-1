import { useEffect, useState } from "react";
import { getStats } from "../api/stats.api";

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getStats();
        setStats(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }
  const totalTickets = Object.values(stats.byStatus).reduce(
    (total, count) => total + count,
    0,
  );

  const openTickets = stats.byStatus.OPEN;
  const reviewedTickets = stats.reviewedCount;
  const agreementRate = stats.modelAgreementRate;

  return (
    <div>
      <h2>Welcome to TriageSync</h2>
      <p>
        Manage support tickets, review classifications, and coordinate resources
        from one place.
      </p>
      <pre>
        <div className="stats-grid">
          <div className="stat-card">
            <p className="stat-label">Total Tickets</p>
            <h2 className="stat-value">{totalTickets}</h2>
            <span className="stat-description">All support tickets</span>
          </div>

          <div className="stat-card">
            <p className="stat-label">Reviewed Tickets</p>
            <h2 className="stat-value">{reviewedTickets}</h2>
            <span className="stat-description">Tickets reviewed by agents</span>
          </div>

          <div className="stat-card">
            <p className="stat-label">Open Tickets</p>
            <h2 className="stat-value">{openTickets}</h2>
            <span className="stat-description">Awaiting resolution</span>
          </div>

          <div className="stat-card">
            <p className="stat-label">Model Agreement Rate</p>
            <h2 className="stat-value">{agreementRate}%</h2>
            <span className="stat-description">
              Agreement with agent reviews
            </span>
          </div>
        </div>
        <section className="dashboard-section">
          <div className="section-header">
            <h2>Ticket Status Overview</h2>
            <span>Current ticket distribution</span>
          </div>

          <div className="status-overview">
            <div className="status-item">
              <span>Open</span>
              <strong>{stats.byStatus.OPEN}</strong>
            </div>

            <div className="status-item">
              <span>In Progress</span>
              <strong>{stats.byStatus.IN_PROGRESS}</strong>
            </div>

            <div className="status-item">
              <span>Resolved</span>
              <strong>{stats.byStatus.RESOLVED}</strong>
            </div>

            <div className="status-item">
              <span>Closed</span>
              <strong>{stats.byStatus.CLOSED}</strong>
            </div>
          </div>
        </section>

        <section className="dashboard-section">
          <div className="section-header">
            <h2>Tickets by Category</h2>
            <span>Category distribution</span>
          </div>

          <div className="category-list">
            {Object.entries(stats.byCategory).map(([category, count]) => (
              <div className="category-item" key={category}>
                <span>{category.replace("_", " ")}</span>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard-section">
          <div className="section-header">
            <h2>Tickets by Priority</h2>
            <span>Priority distribution</span>
          </div>

          <div className="priority-list">
            {Object.entries(stats.byPriority).map(([priority, count]) => (
              <div className="priority-item" key={priority}>
                <span>{priority}</span>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
        </section>
      </pre>
    </div>
  );
}

export default Dashboard;
