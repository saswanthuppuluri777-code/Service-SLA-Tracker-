import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

export const api = {
  // Tickets API
  getTickets: async (params = {}) => {
    const res = await client.get('/tickets', { params });
    return res.data;
  },

  getTicketById: async (id) => {
    const res = await client.get(`/tickets/${id}`);
    return res.data;
  },

  createTicket: async (ticketData) => {
    const res = await client.post('/tickets', ticketData);
    return res.data;
  },

  updateTicket: async (id, updateData) => {
    const res = await client.patch(`/tickets/${id}`, updateData);
    return res.data;
  },

  addComment: async (ticketId, commentData) => {
    const res = await client.post(`/tickets/${ticketId}/comments`, commentData);
    return res.data;
  },

  scanSLAs: async () => {
    const res = await client.post('/tickets/scan-sla');
    return res.data;
  },

  // SLA Policies API
  getSLAPolicies: async (params = {}) => {
    const res = await client.get('/sla-policies', { params });
    return res.data;
  },

  createSLAPolicy: async (policyData) => {
    const res = await client.post('/sla-policies', policyData);
    return res.data;
  },

  updateSLAPolicy: async (id, policyData) => {
    const res = await client.put(`/sla-policies/${id}`, policyData);
    return res.data;
  },

  deleteSLAPolicy: async (id) => {
    const res = await client.delete(`/sla-policies/${id}`);
    return res.data;
  },

  // Dashboard Metrics API
  getDashboardMetrics: async () => {
    const res = await client.get('/dashboard/metrics');
    return res.data;
  },

  // Users API
  getUsers: async (params = {}) => {
    const res = await client.get('/users', { params });
    return res.data;
  },

  // Seed / Reset API
  seedDatabase: async () => {
    const res = await client.post('/seed');
    return res.data;
  },
};

export default api;
