import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const api = axios.create({ baseURL: `${BASE_URL}/api` })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Auth
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
}

// Events
export const eventsApi = {
  list: () => api.get('/events/'),
  get: (id) => api.get(`/events/${id}`),
  create: (data) => api.post('/events/', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
}

// Registrations
export const registrationsApi = {
  register: (data) => api.post('/registrations/', data),
  unregister: (eventId) => api.delete(`/registrations/${eventId}`),
  myRegistrations: () => api.get('/registrations/my'),
  eventRegistrations: (eventId) => api.get(`/registrations/event/${eventId}`),
  exportCSV: (eventId) => api.get(`/registrations/event/${eventId}/export`, { responseType: 'blob' }),
  joinWaitlist: (data) => api.post('/registrations/waitlist', data),
  leaveWaitlist: (eventId) => api.delete(`/registrations/waitlist/${eventId}`),
  myWaitlist: () => api.get('/registrations/waitlist/my'),
}

// Teams
export const teamsApi = {
  create: (data) => api.post('/teams/', data),
  join: (data) => api.post('/teams/join', data),
  myTeams: () => api.get('/teams/my'),
  eventTeams: (eventId) => api.get(`/teams/event/${eventId}`),
  get: (id) => api.get(`/teams/${id}`),
}

// Announcements
export const announcementsApi = {
  create: (data) => api.post('/announcements/', data),
  eventAnnouncements: (eventId) => api.get(`/announcements/event/${eventId}`),
}

// Notifications
export const notificationsApi = {
  list: () => api.get('/notifications/'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
}

// Check-ins
export const checkinsApi = {
  checkin: (data) => api.post('/checkins/', data),
  eventCheckins: (eventId) => api.get(`/checkins/event/${eventId}`),
  generateQR: (eventId) => api.post(`/checkins/generate-qr/${eventId}`),
  verifyQR: (data) => api.post('/checkins/qr-verify', data),
  myCheckin: (eventId) => api.get(`/checkins/my/${eventId}`),
}

// Admin
export const adminApi = {
  stats: () => api.get('/admin/stats'),
  users: () => api.get('/admin/users'),
  analytics: () => api.get('/admin/analytics'),
}

export default api
