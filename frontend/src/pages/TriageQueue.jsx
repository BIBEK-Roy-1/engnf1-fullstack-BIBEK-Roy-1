import { useEffect, useState } from "react";
import { getTickets, importTickets } from "../api/tickets.api";
import { useNavigate } from "react-router-dom";
import { getStats } from "../api/stats.api";

function TriageQueue() {
  const [tickets, setTickets] = useState([]);
  const [filters, setFilters] = useState({
    status: "",
    category: "",
    priority: "",
    q: "",
  });

  const [selectedFile, setSelectedFile] = useState(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");

  const navigate = useNavigate();
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      setStatsError("");

      const data = await getStats();
      setStats(data);
    } catch (err) {
      setStatsError(err.message);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getTickets({
        ...filters,
        page,
        limit: 10,
      });

      setTickets(result.data);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [filters, page]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));

    setPage(1);
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setError("Please select a JSON file.");
      return;
    }

    try {
      setImporting(true);
      setError("");
      setMessage("");

      const text = await selectedFile.text();
      const tickets = JSON.parse(text);

      if (!Array.isArray(tickets) || tickets.length === 0) {
        throw new Error("JSON file must contain a non-empty array.");
      }

      const result = await importTickets(tickets);

      setMessage(
        `Total: ${result.total} | Imported: ${result.importedCount} | Updated: ${result.updatedCount} | Skipped: ${result.skippedOverrideCount}`,
      );
      await fetchTickets();
      await fetchStats();
    } catch (err) {
      setError(err.message || "Failed to import tickets.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="triage-page">
      <div className="page-header">
        <div>
          <h1>Triage Queue</h1>
          <p>Review and manage incoming support tickets.</p>
        </div>

        <div className="ticket-upload">
          <input
            type="file"
            accept=".json,application/json"
            onChange={(e) => setSelectedFile(e.target.files[0] || null)}
          />

          <button onClick={handleImport} disabled={importing || !selectedFile}>
            {importing ? "Importing..." : "Re-Import Feed"}
          </button>
        </div>
      </div>
      {statsLoading ? (
        <p>Loading statistics...</p>
      ) : statsError ? (
        <p className="error-message">{statsError}</p>
      ) : (
        stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <p className="stat-label">Total Tickets</p>
              <h2 className="stat-value">
                {Object.values(stats.byStatus).reduce(
                  (total, count) => total + count,
                  0,
                )}
              </h2>
            </div>

            <div className="stat-card">
              <p className="stat-label">Reviewed Tickets</p>
              <h2 className="stat-value">{stats.reviewedCount}</h2>
            </div>

            <div className="stat-card">
              <p className="stat-label">Open Tickets</p>
              <h2 className="stat-value">{stats.byStatus.OPEN}</h2>
            </div>

            <div className="stat-card">
              <p className="stat-label">Model Agreement Rate</p>
              <h2 className="stat-value">{stats.modelAgreementRate}%</h2>
            </div>
          </div>
        )
      )}

      <div className="triage-filters">
        <input
          type="text"
          name="q"
          placeholder="Search tickets..."
          value={filters.q}
          onChange={handleFilterChange}
        />

        <select
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>

        <select
          name="category"
          value={filters.category}
          onChange={handleFilterChange}
        >
          <option value="">All Categories</option>
          <option value="BILLING">Billing</option>
          <option value="BUG">Bug</option>
          <option value="FEATURE_REQUEST">Feature Request</option>
          <option value="LOGIN">Login</option>
          <option value="DELIVERY">Delivery</option>
        </select>

        <select
          name="priority"
          value={filters.priority}
          onChange={handleFilterChange}
        >
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
      </div>

      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      {loading ? (
        <p>Loading tickets...</p>
      ) : tickets.length === 0 ? (
        <p>No tickets found.</p>
      ) : (
        <>
          <div className="ticket-list">
            <div className="ticket-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>External ID</th>
                    <th>Subject</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>

                <tbody>
                  {tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      onClick={() => navigate(`/triage/${ticket.id}`)}
                      className="ticket-row"
                    >
                      <td>{ticket.externalId}</td>
                      <td>{ticket.subject}</td>
                      <td>{ticket.category}</td>
                      <td>{ticket.priority}</td>
                      <td>{ticket.status}</td>
                      <td>{new Date(ticket.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="pagination">
            <button
              disabled={page <= 1}
              onClick={() => setPage((prev) => prev - 1)}
            >
              Previous
            </button>

            <span>
              Page {page} of {totalPages}
            </span>

            <button
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default TriageQueue;
