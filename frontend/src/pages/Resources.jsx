import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getResources } from '../api/resources.api';

export default function Resources() {
  const navigate = useNavigate();

  const [resources, setResources] = useState([]);

  const [filters, setFilters] = useState({
    search: '',
    type: '',
    minCapacity: '',
  });

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function fetchResources() {
      try {
        setLoading(true);
        setError('');

        const result = await getResources({
          ...filters,
          search: filters.search.trim(),
          page,
          pageSize: 10,
        });

        if (!active) return;

        setResources(result.data);
        setTotalPages(result.totalPages);
        setTotal(result.total);
      } catch (err) {
        if (active) {
          setError(err.message || 'Failed to load resources.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchResources();

    return () => {
      active = false;
    };
  }, [filters, page]);

  function handleFilterChange(e) {
    const { name, value } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));

    setPage(1);
  }

  return (
    <div className="resources-page">
      <h1>Resources</h1>
      <p>Find and book available resources.</p>

      <div className="resource-filters">
        <input
          type="search"
          name="search"
          placeholder="Search resources..."
          value={filters.search}
          onChange={handleFilterChange}
        />

        <select
          name="type"
          value={filters.type}
          onChange={handleFilterChange}
        >
          <option value="">All Types</option>
          <option value="ROOM">Room</option>
          <option value="LAB">Lab</option>
          <option value="EQUIPMENT">Equipment</option>
        </select>

        <input
          type="number"
          name="minCapacity"
          placeholder="Minimum capacity"
          min="1"
          max="500"
          value={filters.minCapacity}
          onChange={handleFilterChange}
        />
      </div>

      {loading ? (
        <p>Loading resources...</p>
      ) : error ? (
        <p className="resource-error">{error}</p>
      ) : resources.length === 0 ? (
        <p>No resources found.</p>
      ) : (
        <>
          <p>{total} resources found</p>

          <div className="resource-grid">
            {resources.map((resource) => (
              <div
                className="resource-card"
                key={resource.id}
              >
                <h3>{resource.name}</h3>

                <p>Type: {resource.type}</p>
                <p>Capacity: {resource.capacity}</p>

                <p>
                  Status: {resource.isActive
                    ? 'Active'
                    : 'Inactive'}
                </p>

                <p>
                  {resource.description ||
                    'No description available.'}
                </p>

                <button
                  className="resource-button"
                  onClick={() =>
                    navigate(`/resources/${resource.id}`)
                  }
                >
                  View Details
                </button>
              </div>
            ))}
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