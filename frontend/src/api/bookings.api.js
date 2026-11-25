import { apiRequest } from "./client";

export function createBooking(data) {
  return apiRequest("/bookings", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getMyBookings(params = {}) {
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== "" && value != null),
  );

  const query = new URLSearchParams(filteredParams).toString();

  return apiRequest(`/bookings/mine?${query}`);
}

export function cancelBooking(id) {
  return apiRequest(`/bookings/${id}/cancel`, {
    method: "PATCH",
  });
}

export function getAllBookings(params = {}) {
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== "" && value !== undefined && value !== null,
    ),
  );

  const query = new URLSearchParams(filteredParams).toString();

  return apiRequest(`/bookings?${query}`);
}

export function approveBooking(id) {
  return apiRequest(`/bookings/${id}/approve`, {
    method: "PATCH",
  });
}

export function rejectBooking(id, note) {
  return apiRequest(`/bookings/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ note }),
  });
}
