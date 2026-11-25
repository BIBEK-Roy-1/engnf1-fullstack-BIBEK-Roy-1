import { apiRequest } from './client';

export function getStats() {
  return apiRequest('/stats');
}
export function getAdminStats() {
  return apiRequest("/admin/stats");
}