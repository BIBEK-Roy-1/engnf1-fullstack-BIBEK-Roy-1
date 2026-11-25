import { apiRequest } from './client';

export function getResources(params = {}) {
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) =>
        value !== '' &&
        value !== undefined &&
        value !== null
    )
  );

  const query = new URLSearchParams(filteredParams).toString();

  return apiRequest(`/resources?${query}`);
}

export function getResourceById(id) {
  return apiRequest(`/resources/${id}`);
}

export function getResourceAvailability(id, from, to) {
  const query = new URLSearchParams({ from, to });

  return apiRequest(`/resources/${id}/availability?${query}`);
}
