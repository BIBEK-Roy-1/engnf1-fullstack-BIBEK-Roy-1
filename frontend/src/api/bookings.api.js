import { apiRequest } from './client';

export function createBooking(data) {
  return apiRequest('/bookings', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getMyBookings(params = {}) {
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== '' && value != null
    )
  );

  const query = new URLSearchParams(filteredParams).toString();

  return apiRequest(`/bookings/mine?${query}`);
}

export function cancelBooking(id) {
  return apiRequest(`/bookings/${id}/cancel`, {
    method: 'PATCH',
  });
}