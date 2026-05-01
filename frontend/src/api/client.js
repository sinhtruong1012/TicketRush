const API_BASE = '/api';

const getToken = () => sessionStorage.getItem('ticketrush_token');

const apiClient = async (endpoint, options = {}) => {
  const token = getToken();
  
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  let text = '';
  let data;
  try {
    text = await response.text();
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    throw new Error(`Invalid JSON response: ${text.substring(0, 100)} (Status: ${response.status})`);
  }

  if (!response.ok) {
    throw { status: response.status, ...data };
  }

  return data;
};

export const api = {
  // Auth
  register: (body) => apiClient('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => apiClient('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => apiClient('/auth/me'),
  logout: () => apiClient('/auth/logout', { method: 'POST' }),
  updateProfile: (body) => apiClient('/auth/profile', { method: 'PUT', body: body instanceof FormData ? body : JSON.stringify(body) }),

  // Config — [FIX 26/27] read business constants from backend
  getConfig: () => apiClient('/config'),

  // Events
  getEvents: (params = '') => apiClient(`/events?${params}`),
  getEvent: (id) => apiClient(`/events/${id}`),
  createEvent: (body) => apiClient('/events', { method: 'POST', body: JSON.stringify(body) }),
  updateEvent: (id, body) => apiClient(`/events/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteEvent: (id) => apiClient(`/events/${id}`, { method: 'DELETE' }),
  addSection: (eventId, body) => apiClient(`/events/${eventId}/sections`, { method: 'POST', body: JSON.stringify(body) }),
  deleteSection: (sectionId) => apiClient(`/events/sections/${sectionId}`, { method: 'DELETE' }),


  // Seats
  getSeats: (eventId) => apiClient(`/seats/event/${eventId}`),
  lockSeat: (seatId) => apiClient(`/seats/${seatId}/lock`, { method: 'POST' }),
  unlockSeat: (seatId) => apiClient(`/seats/${seatId}/unlock`, { method: 'POST' }),

  // Orders
  createOrder: (body) => apiClient('/orders/create', { method: 'POST', body: JSON.stringify(body) }),
  confirmOrder: (id) => apiClient(`/orders/${id}/confirm`, { method: 'POST' }),
  cancelOrder: (id) => apiClient(`/orders/${id}/cancel`, { method: 'POST' }),
  getMyTickets: () => apiClient('/orders/my-tickets'),
  getOrder: (id) => apiClient(`/orders/${id}`),

  // Queue
  joinQueue: (eventId) => apiClient(`/queue/${eventId}/join`, { method: 'POST' }),
  getQueueStatus: (eventId) => apiClient(`/queue/${eventId}/status`),

  // Admin
  getRealtimeStats: () => apiClient('/admin/realtime'),
  getReportStats: (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return apiClient(`/admin/reports?${params.toString()}`);
  },
};

export default api;
