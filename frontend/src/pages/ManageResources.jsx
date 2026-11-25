import { useEffect, useState } from "react";

import {
  getResources,
  createResource,
  updateResource,
} from "../api/resources.api";

const emptyForm = {
  name: "",
  type: "ROOM",
  capacity: "",
  description: "",
};

export default function ManageResources() {
  const [resources, setResources] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadResources() {
    try {
      setLoading(true);
      setError("");

      const result = await getResources({
        search,
        type,
        page,
        pageSize: 10,
      });

      setResources(result.data);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadResources();
  }, [search, type, page]);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleEdit(resource) {
    setEditingId(resource.id);

    setForm({
      name: resource.name,
      type: resource.type,
      capacity: resource.capacity,
      description: resource.description || "",
    });

    setError("");
    setMessage("");
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setMessage("");

    const data = {
      name: form.name.trim(),
      type: form.type,
      capacity: Number(form.capacity),
      description: form.description.trim(),
    };

    if (data.name.length < 3) {
      setError("Resource name must contain at least 3 characters.");
      return;
    }

    try {
      setSaving(true);

      if (editingId) {
        await updateResource(editingId, data);
        setMessage("Resource updated successfully.");
      } else {
        await createResource(data);
        setMessage("Resource created successfully.");
      }

      resetForm();
      await loadResources();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(resource) {
    const action = resource.isActive ? "deactivate" : "activate";

    if (!window.confirm(`Do you want to ${action} this resource?`)) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await updateResource(resource.id, {
        isActive: !resource.isActive,
      });

      setMessage("Resource status updated successfully.");
      await loadResources();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="manage-resources-page">
      <h1>Manage Resources</h1>
      <p>Create, update and manage available resources.</p>

      {error && <p className="resource-error">{error}</p>}
      {message && <p className="resource-success">{message}</p>}

      <div className="resource-panel">
        <h2>{editingId ? "Edit Resource" : "Create Resource"}</h2>

        <form className="resource-form" onSubmit={handleSubmit}>
          <label className="resource-field">
            Resource Name
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              minLength={3}
              maxLength={60}
              required
            />
          </label>

          <label className="resource-field">
            Resource Type
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              required
            >
              <option value="ROOM">Room</option>
              <option value="LAB">Lab</option>
              <option value="EQUIPMENT">Equipment</option>
            </select>
          </label>

          <label className="resource-field">
            Capacity
            <input
              type="number"
              name="capacity"
              value={form.capacity}
              onChange={handleChange}
              min={1}
              max={500}
              step={1}
              required
            />
          </label>

          <label className="resource-field">
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              maxLength={300}
            />
          </label>

          <div className="admin-resource-actions">
            <button type="submit" className="resource-button" disabled={saving}>
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Resource"
                  : "Create Resource"}
            </button>

            {editingId && (
              <button
                type="button"
                className="back-button"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="resource-panel">
        <h2>All Resources</h2>

        <div className="resource-filters">
          <input
            type="text"
            placeholder="Search resources..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />

          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Types</option>
            <option value="ROOM">Room</option>
            <option value="LAB">Lab</option>
            <option value="EQUIPMENT">Equipment</option>
          </select>
        </div>

        {loading ? (
          <p>Loading resources...</p>
        ) : resources.length === 0 ? (
          <p>No resources found.</p>
        ) : (
          <div className="resource-grid">
            {resources.map((resource) => (
              <div className="resource-card" key={resource.id}>
                <h3>{resource.name}</h3>

                <p>Type: {resource.type}</p>
                <p>Capacity: {resource.capacity}</p>
                <p>{resource.description || "No description."}</p>

                <p>
                  Status:{" "}
                  <strong>{resource.isActive ? "Active" : "Inactive"}</strong>
                </p>

                <div className="admin-resource-actions">
                  <button
                    className="resource-button"
                    onClick={() => handleEdit(resource)}
                    disabled={saving}
                  >
                    Edit
                  </button>

                  <button
                    className="back-button"
                    onClick={() => handleToggle(resource)}
                    disabled={saving}
                  >
                    {resource.isActive ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>
            ))}
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
