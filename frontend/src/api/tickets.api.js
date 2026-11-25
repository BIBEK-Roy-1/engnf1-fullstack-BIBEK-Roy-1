
import { apiRequest } from './client';

export function getTickets(params = {}) {
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== '' && value !== undefined && value !== null
    )
  );

  const query = new URLSearchParams(filteredParams).toString();

  return apiRequest(`/tickets?${query}`);
}
export function importTickets(tickets) {
  return apiRequest('/tickets/import', {
    method: 'POST',
    body: JSON.stringify({ tickets }),
  });
}
export function getTicketDetail(id) {
  return apiRequest(`/tickets/${id}`);
}

export function updateTicket(id, data) {
  return apiRequest(`/tickets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
