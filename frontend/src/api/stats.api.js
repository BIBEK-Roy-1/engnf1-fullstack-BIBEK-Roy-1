import { apiRequest } from './client';

export function getStats() {
  return apiRequest('/stats');
}