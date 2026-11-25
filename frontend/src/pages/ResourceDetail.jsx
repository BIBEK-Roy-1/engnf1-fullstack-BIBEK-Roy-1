import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { getResourceById, getResourceAvailability } from "../api/resources.api";

import { createBooking } from "../api/bookings.api";

function localDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const timeSlots = Array.from({ length: 48 }, (_, i) => {
  const hours = String(Math.floor(i / 2)).padStart(2, "0");
  const minutes = i % 2 === 0 ? "00" : "30";

  return `${hours}:${minutes}`;
});

export default function ResourceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [resource, setResource] = useState(null);
  const [bookings, setBookings] = useState([]);

  const [date, setDate] = useState(localDateString(new Date()));

  const [form, setForm] = useState({
    startTime: "",
    endTime: "",
    purpose: "",
    ticketId: "",
  });

  const [loading, setLoading] = useState(true);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);

  const [availabilityDate, setAvailabilityDate] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [availabilityError, setAvailabilityError] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [message, setMessage] = useState("");
  const [refresh, setRefresh] = useState(0);

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);

  const availableStartTimes = timeSlots.filter((time) => {
    const slot = new Date(`${date}T${time}`);

    return (
      time !== "23:30" &&
      slot > new Date() &&
      slot.getTime() <= Date.now() + 30 * 86400000
    );
  });

  const availableEndTimes = timeSlots.filter((time) => {
    if (!form.startTime) return false;

    const start = new Date(`${date}T${form.startTime}`);
    const end = new Date(`${date}T${time}`);

    const duration = (end - start) / 60000;

    return duration >= 30 && duration <= 240;
  });

  useEffect(() => {
    let active = true;

    async function fetchResource() {
      try {
        setLoading(true);
        setError("");

        const result = await getResourceById(id);

        if (active) setResource(result);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchResource();

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    let active = true;

    async function fetchAvailability() {
      try {
        setAvailabilityLoading(true);
        setAvailabilityError("");
        setAvailabilityDate("");

        const from = new Date(`${date}T00:00:00`);
        const to = new Date(from);

        to.setDate(to.getDate() + 1);

        const result = await getResourceAvailability(
          id,
          from.toISOString(),
          to.toISOString(),
        );

        if (active) {
          setBookings(result.bookings);
          setAvailabilityDate(date);
        }
      } catch (err) {
        if (active) {
          setBookings([]);
          setAvailabilityError(err.message);
        }
      } finally {
        if (active) setAvailabilityLoading(false);
      }
    }

    if (date) fetchAvailability();

    return () => {
      active = false;
    };
  }, [id, date, refresh]);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "startTime" ? { endTime: "" } : {}),
    }));
  }

  async function handleBooking(e) {
    e.preventDefault();

    setBookingError("");
    setMessage("");

    const start = new Date(`${date}T${form.startTime}`);
    const end = new Date(`${date}T${form.endTime}`);

    const duration = (end - start) / 60000;

    if (!Number.isFinite(duration) || duration < 30 || duration > 240) {
      setBookingError("Booking duration must be between 30 and 240 minutes.");
      return;
    }

    if (
      start.getUTCMinutes() % 30 !== 0 ||
      end.getUTCMinutes() % 30 !== 0 ||
      start.getUTCSeconds() !== 0 ||
      end.getUTCSeconds() !== 0 ||
      start.getUTCMilliseconds() !== 0 ||
      end.getUTCMilliseconds() !== 0
    ) {
      setBookingError("Select times in 30-minute intervals.");
      return;
    }

    if (start <= new Date()) {
      setBookingError("Start time must be in the future.");
      return;
    }

    if (start.getTime() > Date.now() + 30 * 86400000) {
      setBookingError("Bookings must be within 30 days.");
      return;
    }

    if (form.purpose.trim().length < 5) {
      setBookingError("Purpose must contain at least 5 characters.");
      return;
    }

    if (availabilityLoading || availabilityError || availabilityDate !== date) {
      setBookingError("Please wait for availability to load.");
      return;
    }

    const overlap = bookings.some(
      (booking) =>
        new Date(booking.startTime) < end && new Date(booking.endTime) > start,
    );

    if (overlap) {
      setBookingError("This resource is already booked for the selected time.");
      return;
    }

    try {
      setSaving(true);

      await createBooking({
        resourceId: id,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        purpose: form.purpose.trim(),
        ...(form.ticketId.trim() ? { ticketId: form.ticketId.trim() } : {}),
      });

      setMessage("Booking submitted successfully. Awaiting admin approval.");

      setForm({
        startTime: "",
        endTime: "",
        purpose: "",
        ticketId: "",
      });

      setAvailabilityDate("");
      setRefresh((prev) => prev + 1);
    } catch (err) {
      setBookingError(err.message || "Booking failed.");
      setAvailabilityDate("");
      setRefresh((prev) => prev + 1);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Loading resource...</p>;

  if (error) {
    return <p className="resource-error">{error}</p>;
  }

  if (!resource) return <p>Resource not found.</p>;

  return (
    <div className="resource-detail-page">
      <button className="back-button" onClick={() => navigate("/resources")}>
        ← Back to Resources
      </button>

      <div className="resource-panel">
        <h1>{resource.name}</h1>

        <p>Type: {resource.type}</p>
        <p>Capacity: {resource.capacity}</p>
        <p>{resource.description || "No description."}</p>

        <p>Status: {resource.isActive ? "Active" : "Inactive"}</p>
      </div>

      <div className="resource-panel">
        <h2>Availability</h2>

        <label className="resource-field">
          Select Date
          <input
            type="date"
            value={date}
            min={localDateString(new Date())}
            max={localDateString(maxDate)}
            onChange={(e) => {
              setDate(e.target.value);
              setForm((prev) => ({
                ...prev,
                startTime: "",
                endTime: "",
              }));
              setMessage("");
              setBookingError("");
            }}
            disabled={saving}
            required
          />
        </label>

        {availabilityLoading ? (
          <p>Checking availability...</p>
        ) : availabilityError ? (
          <p className="resource-error">{availabilityError}</p>
        ) : bookings.length === 0 ? (
          <p className="resource-success">
            No existing bookings for this date.
          </p>
        ) : (
          <div className="availability-list">
            <h3>Reserved time slots</h3>

            {bookings.map((booking, index) => (
              <div className="availability-item" key={index}>
                <span>
                  {new Date(booking.startTime).toLocaleString()}
                  {" — "}
                  {new Date(booking.endTime).toLocaleString()}
                </span>

                <strong>{booking.status}</strong>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="resource-panel">
        <h2>Book Resource</h2>

        {!resource.isActive ? (
          <p>This resource is inactive.</p>
        ) : (
          <form className="resource-form" onSubmit={handleBooking}>
            <div className="booking-time-fields">
              <label className="resource-field">
                Start Time
                <select
                  name="startTime"
                  value={form.startTime}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select start time</option>

                  {availableStartTimes.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </label>

              <label className="resource-field">
                End Time
                <select
                  name="endTime"
                  value={form.endTime}
                  onChange={handleChange}
                  disabled={!form.startTime}
                  required
                >
                  <option value="">Select end time</option>

                  {availableEndTimes.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="resource-field">
              Purpose
              <textarea
                name="purpose"
                placeholder="Why do you need this resource?"
                value={form.purpose}
                onChange={handleChange}
                minLength={5}
                maxLength={200}
                required
              />
            </label>

            <label className="resource-field">
              Ticket ID (Optional)
              <input
                type="text"
                name="ticketId"
                placeholder="Enter ticket database ID"
                value={form.ticketId}
                onChange={handleChange}
              />
            </label>

            {bookingError && <p className="resource-error">{bookingError}</p>}

            {message && <p className="resource-success">{message}</p>}

            <button
              className="resource-button"
              disabled={
                saving ||
                !date ||
                availabilityLoading ||
                Boolean(availabilityError) ||
                availabilityDate !== date
              }
              type="submit"
            >
              {saving ? "Submitting..." : "Request Booking"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
