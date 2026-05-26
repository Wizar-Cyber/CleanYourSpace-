import http from 'http';

const PORT = 4000;
const HOST = '127.0.0.1';

const USERS = [
  { id: 'admin-1', email: 'admin@corecon.us', firstName: 'Admin', lastName: 'Corecon', role: 'admin', language: 'es', isActive: true },
  { id: 'admin-2', email: 'super@corecon.us', firstName: 'Super', lastName: 'Admin', role: 'admin', language: 'en', isActive: true },
  { id: 'cleaner-1', email: 'cleaner@corecon.us', firstName: 'Juan', lastName: 'Pérez', role: 'cleaner', language: 'es', hourlyRate: 25, isActive: true, phone: '555-0101' },
  { id: 'cleaner-2', email: 'maria@corecon.us', firstName: 'María', lastName: 'García', role: 'cleaner', language: 'es', hourlyRate: 30, isActive: true, phone: '555-0102' },
  { id: 'cleaner-3', email: 'carlos@corecon.us', firstName: 'Carlos', lastName: 'López', role: 'cleaner', language: 'en', hourlyRate: 28, isActive: true, phone: '555-0103' },
  { id: 'cleaner-4', email: 'ana@corecon.us', firstName: 'Ana', lastName: 'Martínez', role: 'cleaner', language: 'es', hourlyRate: 22, isActive: true, phone: '555-0104' },
  { id: 'cleaner-5', email: 'pedro@corecon.us', firstName: 'Pedro', lastName: 'Ramírez', role: 'cleaner', language: 'es', hourlyRate: 27, isActive: true, phone: '555-0105' },
  { id: 'cleaner-6', email: 'laura@corecon.us', firstName: 'Laura', lastName: 'Fernández', role: 'cleaner', language: 'en', hourlyRate: 32, isActive: true, phone: '555-0106' },
  { id: 'cleaner-7', email: 'diego@corecon.us', firstName: 'Diego', lastName: 'Torres', role: 'cleaner', language: 'es', hourlyRate: 24, isActive: true, phone: '555-0107' },
  { id: 'cleaner-8', email: 'valeria@corecon.us', firstName: 'Valeria', lastName: 'Muñoz', role: 'cleaner', language: 'en', hourlyRate: 26, isActive: true, phone: '555-0108' },
  { id: 'cleaner-9', email: 'andres@corecon.us', firstName: 'Andrés', lastName: 'Silva', role: 'cleaner', language: 'es', hourlyRate: 29, isActive: false, phone: '555-0109' },
  { id: 'cleaner-10', email: 'sofia@corecon.us', firstName: 'Sofía', lastName: 'Castro', role: 'cleaner', language: 'es', hourlyRate: 23, isActive: true, phone: '555-0110' },
  { id: 'cleaner-11', email: 'javier@corecon.us', firstName: 'Javier', lastName: 'Morales', role: 'cleaner', language: 'en', hourlyRate: 31, isActive: true, phone: '555-0111' },
  { id: 'cleaner-12', email: 'carolina@corecon.us', firstName: 'Carolina', lastName: 'Rivas', role: 'cleaner', language: 'es', hourlyRate: 27, isActive: false, phone: '555-0112' },
];

const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

const SANTIAGO_LAT = -33.4489;
const SANTIAGO_LNG = -70.6693;

const SERVICES = [
  { id: 'svc-1', clientName: 'Residencial Los Olivos', clientPhone: '555-1001', clientEmail: 'olivos@mail.com', address: 'Av. Los Olivos 123, Santiago', latitude: SANTIAGO_LAT, longitude: SANTIAGO_LNG, serviceType: 'regular', status: 'pending', scheduledDate: today, frequency: 'weekly', notes: 'Entrar por la puerta trasera', createdAt: '2026-05-20T10:00:00Z', updatedAt: '2026-05-20T10:00:00Z' },
  { id: 'svc-2', clientName: 'Oficinas Centro', clientPhone: '555-1002', clientEmail: 'centro@mail.com', address: 'Calle Principal 456, Oficina 3, Santiago', latitude: SANTIAGO_LAT + 0.001, longitude: SANTIAGO_LNG - 0.002, serviceType: 'deep_clean', status: 'in_progress', scheduledDate: today, frequency: 'monthly', notes: '', createdAt: '2026-05-19T09:00:00Z', updatedAt: '2026-05-23T08:00:00Z' },
  { id: 'svc-3', clientName: 'Casa Rodríguez', clientPhone: '555-1003', clientEmail: 'rodriguez@mail.com', address: 'Colina Verde 789, Vitacura', latitude: SANTIAGO_LAT - 0.005, longitude: SANTIAGO_LNG + 0.003, serviceType: 'regular', status: 'completed', scheduledDate: yesterday, frequency: 'biweekly', notes: 'Dejar llave en el buzón', createdAt: '2026-05-18T08:00:00Z', updatedAt: '2026-05-23T14:00:00Z' },
  { id: 'svc-4', clientName: 'Departamento Norte', clientPhone: '555-1004', clientEmail: 'norte@mail.com', address: 'Av. Norte 321, Depto 7B, Las Condes', latitude: SANTIAGO_LAT + 0.01, longitude: SANTIAGO_LNG - 0.005, serviceType: 'move_out', status: 'pending_verification', scheduledDate: today, frequency: 'one_time', notes: 'Departamento vacío', createdAt: '2026-05-21T11:00:00Z', updatedAt: '2026-05-22T16:00:00Z' },
  { id: 'svc-5', clientName: 'Clínica Dental Sonrisa', clientPhone: '555-1005', clientEmail: 'sonrisa@mail.com', address: 'Av. Providencia 789, Providencia', latitude: SANTIAGO_LAT - 0.003, longitude: SANTIAGO_LNG + 0.001, serviceType: 'commercial', status: 'completed', scheduledDate: yesterday, frequency: 'weekly', notes: 'Usar productos desinfectantes', createdAt: '2026-05-17T10:00:00Z', updatedAt: '2026-05-23T12:00:00Z' },
  { id: 'svc-6', clientName: 'Colegio San Miguel', clientPhone: '555-1006', clientEmail: 'sanmiguel@mail.com', address: 'Calle Los Alerces 456, Ñuñoa', latitude: SANTIAGO_LAT + 0.008, longitude: SANTIAGO_LNG - 0.01, serviceType: 'commercial', status: 'in_progress', scheduledDate: today, frequency: 'daily', notes: 'Limpiar después de las 18:00', createdAt: '2026-05-15T08:00:00Z', updatedAt: '2026-05-24T10:00:00Z' },
  { id: 'svc-7', clientName: 'Departamento García', clientPhone: '555-1007', clientEmail: 'garcia@mail.com', address: 'Av. Los Leones 1234, Depto 5C, Providencia', latitude: SANTIAGO_LAT - 0.002, longitude: SANTIAGO_LNG + 0.004, serviceType: 'regular', status: 'completed', scheduledDate: yesterday, frequency: 'weekly', notes: '', createdAt: '2026-05-14T09:00:00Z', updatedAt: '2026-05-23T11:00:00Z' },
  { id: 'svc-8', clientName: 'Restaurante La Marina', clientPhone: '555-1008', clientEmail: 'lamarina@mail.com', address: 'Costanera 890, Viña del Mar', latitude: SANTIAGO_LAT - 0.1, longitude: SANTIAGO_LNG + 0.15, serviceType: 'deep_clean', status: 'pending', scheduledDate: tomorrow, frequency: 'monthly', notes: 'Cocina y baños prioritarios', createdAt: '2026-05-22T10:00:00Z', updatedAt: '2026-05-22T10:00:00Z' },
  { id: 'svc-9', clientName: 'Oficinas TechCorp', clientPhone: '555-1009', clientEmail: 'techcorp@mail.com', address: 'Nueva Costanera 3400, Oficina 12, Las Condes', latitude: SANTIAGO_LAT + 0.004, longitude: SANTIAGO_LNG - 0.003, serviceType: 'commercial', status: 'pending_verification', scheduledDate: today, frequency: 'weekly', notes: 'Solicitar identificación en recepción', createdAt: '2026-05-23T09:00:00Z', updatedAt: '2026-05-24T08:00:00Z' },
  { id: 'svc-10', clientName: 'Casa Hurtado', clientPhone: '555-1010', clientEmail: 'hurtado@mail.com', address: 'Camino del Sol 567, Lo Barnechea', latitude: SANTIAGO_LAT + 0.02, longitude: SANTIAGO_LNG - 0.015, serviceType: 'regular', status: 'returned', scheduledDate: yesterday, frequency: 'biweekly', notes: 'Ventanas grandes necesitan atención especial', createdAt: '2026-05-16T10:00:00Z', updatedAt: '2026-05-24T09:00:00Z', rejectionNote: 'Faltó limpiar ventanas del segundo piso y el baño principal quedó con manchas.' },
  { id: 'svc-11', clientName: 'Gimnasio FitLife', clientPhone: '555-1011', clientEmail: 'fitlife@mail.com', address: 'Av. Las Condes 6789, Local 3, Las Condes', latitude: SANTIAGO_LAT + 0.006, longitude: SANTIAGO_LNG - 0.004, serviceType: 'commercial', status: 'pending', scheduledDate: tomorrow, frequency: 'daily', notes: 'Equipos deben ser desinfectados', createdAt: '2026-05-21T08:00:00Z', updatedAt: '2026-05-21T08:00:00Z' },
  { id: 'svc-12', clientName: 'Penthouse Vista Mar', clientPhone: '555-1012', clientEmail: 'vistamar@mail.com', address: 'Av. del Mar 234, Torre A, Depto 20A, Viña del Mar', latitude: SANTIAGO_LAT - 0.09, longitude: SANTIAGO_LNG + 0.12, serviceType: 'move_out', status: 'in_progress', scheduledDate: today, frequency: 'one_time', notes: 'Propiedad en venta, dejar impecable', createdAt: '2026-05-22T11:00:00Z', updatedAt: '2026-05-24T08:00:00Z' },
];

const now = new Date();
const timeToday = (h, m) => {
  const d = new Date(now); d.setHours(h, m, 0, 0);
  return d.toISOString();
};

const ASSIGNMENTS = [
  { id: 'ass-1', serviceId: 'svc-2', cleanerId: 'cleaner-1', cleanerName: 'Juan Pérez', status: 'in_progress', scheduledDate: today, scheduledStartTime: '09:00', scheduledEndTime: '12:00', hourlyRateSnapshot: 25, timerStart: timeToday(8, 55), timerEnd: null, totalMinutes: null, paymentCalculated: null, createdAt: '2026-05-19T09:00:00Z' },
  { id: 'ass-2', serviceId: 'svc-6', cleanerId: 'cleaner-2', cleanerName: 'María García', status: 'in_progress', scheduledDate: today, scheduledStartTime: '14:00', scheduledEndTime: '18:00', hourlyRateSnapshot: 30, timerStart: timeToday(13, 50), timerEnd: null, totalMinutes: null, paymentCalculated: null, createdAt: '2026-05-15T08:00:00Z' },
  { id: 'ass-3', serviceId: 'svc-12', cleanerId: 'cleaner-3', cleanerName: 'Carlos López', status: 'in_progress', scheduledDate: today, scheduledStartTime: '10:00', scheduledEndTime: '16:00', hourlyRateSnapshot: 28, timerStart: timeToday(9, 45), timerEnd: null, totalMinutes: null, paymentCalculated: null, createdAt: '2026-05-22T11:00:00Z' },
  { id: 'ass-4', serviceId: 'svc-4', cleanerId: 'cleaner-4', cleanerName: 'Ana Martínez', status: 'pending_verification', scheduledDate: today, scheduledStartTime: '08:00', scheduledEndTime: '11:00', hourlyRateSnapshot: 22, timerStart: timeToday(7, 55), timerEnd: timeToday(10, 40), totalMinutes: 165, paymentCalculated: 60.50, createdAt: '2026-05-21T11:00:00Z' },
  { id: 'ass-5', serviceId: 'svc-9', cleanerId: 'cleaner-5', cleanerName: 'Pedro Ramírez', status: 'pending_verification', scheduledDate: today, scheduledStartTime: '15:00', scheduledEndTime: '18:00', hourlyRateSnapshot: 27, timerStart: timeToday(14, 50), timerEnd: timeToday(17, 45), totalMinutes: 175, paymentCalculated: 78.75, createdAt: '2026-05-23T09:00:00Z' },
  { id: 'ass-6', serviceId: 'svc-3', cleanerId: 'cleaner-6', cleanerName: 'Laura Fernández', status: 'completed', scheduledDate: yesterday, scheduledStartTime: '09:00', scheduledEndTime: '11:00', hourlyRateSnapshot: 32, timerStart: timeToday(8, 50), timerEnd: timeToday(10, 55), totalMinutes: 125, paymentCalculated: 66.67, createdAt: '2026-05-18T08:00:00Z' },
  { id: 'ass-7', serviceId: 'svc-5', cleanerId: 'cleaner-7', cleanerName: 'Diego Torres', status: 'completed', scheduledDate: yesterday, scheduledStartTime: '08:00', scheduledEndTime: '12:00', hourlyRateSnapshot: 24, timerStart: timeToday(7, 50), timerEnd: timeToday(11, 55), totalMinutes: 245, paymentCalculated: 98.00, createdAt: '2026-05-17T10:00:00Z' },
  { id: 'ass-8', serviceId: 'svc-7', cleanerId: 'cleaner-8', cleanerName: 'Valeria Muñoz', status: 'completed', scheduledDate: yesterday, scheduledStartTime: '10:00', scheduledEndTime: '12:00', hourlyRateSnapshot: 26, timerStart: timeToday(9, 55), timerEnd: timeToday(11, 50), totalMinutes: 115, paymentCalculated: 49.83, createdAt: '2026-05-14T09:00:00Z' },
  { id: 'ass-9', serviceId: 'svc-10', cleanerId: 'cleaner-1', cleanerName: 'Juan Pérez', status: 'returned', scheduledDate: yesterday, scheduledStartTime: '14:00', scheduledEndTime: '17:00', hourlyRateSnapshot: 25, timerStart: timeToday(13, 50), timerEnd: timeToday(16, 55), totalMinutes: 185, paymentCalculated: 77.08, createdAt: '2026-05-16T10:00:00Z', rejectionNote: 'Faltó limpiar ventanas del segundo piso. Baño principal quedó con manchas de moho.' },
  { id: 'ass-10', serviceId: 'svc-1', cleanerId: null, status: 'pending', scheduledDate: today, scheduledStartTime: '08:00', scheduledEndTime: '10:00', hourlyRateSnapshot: null, timerStart: null, timerEnd: null, totalMinutes: null, paymentCalculated: null, createdAt: '2026-05-20T10:00:00Z' },
  { id: 'ass-11', serviceId: 'svc-8', cleanerId: null, status: 'pending', scheduledDate: tomorrow, scheduledStartTime: '09:00', scheduledEndTime: '14:00', hourlyRateSnapshot: null, timerStart: null, timerEnd: null, totalMinutes: null, paymentCalculated: null, createdAt: '2026-05-22T10:00:00Z' },
  { id: 'ass-12', serviceId: 'svc-11', cleanerId: null, status: 'pending', scheduledDate: tomorrow, scheduledStartTime: '06:00', scheduledEndTime: '09:00', hourlyRateSnapshot: null, timerStart: null, timerEnd: null, totalMinutes: null, paymentCalculated: null, createdAt: '2026-05-21T08:00:00Z' },
];

const REPORTS = [
  { id: 'rep-1', type: 'weekly', format: 'pdf', filename: 'report-weekly-2026-05-17-2026-05-23.pdf', generatedBy: 'admin-1', dateFrom: '2026-05-17', dateTo: '2026-05-23', createdAt: '2026-05-23T12:00:00Z' },
  { id: 'rep-2', type: 'monthly', format: 'xlsx', filename: 'report-monthly-2026-04-24-2026-05-23.xlsx', generatedBy: 'admin-2', dateFrom: '2026-04-24', dateTo: '2026-05-23', createdAt: '2026-05-23T14:00:00Z' },
  { id: 'rep-3', type: 'services', format: 'pdf', filename: 'report-services-2026-05-01-2026-05-22.pdf', generatedBy: 'admin-1', dateFrom: '2026-05-01', dateTo: '2026-05-22', createdAt: '2026-05-22T09:00:00Z' },
  { id: 'rep-4', type: 'cleaner', format: 'pdf', filename: 'report-cleaner-cleaner-1-2026-05-01-2026-05-23.pdf', generatedBy: 'admin-1', dateFrom: '2026-05-01', dateTo: '2026-05-23', createdAt: '2026-05-23T16:00:00Z' },
];

const CHECKLISTS = {};
const CHECKLIST_ITEMS = {};

function json(body, status = 200) {
  return { status, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

function parseUrl(url) {
  const [path, queryString] = url.split('?');
  const params = {};
  if (queryString) {
    queryString.split('&').forEach(p => { const [k, v] = p.split('='); params[decodeURIComponent(k)] = decodeURIComponent(v || ''); });
  }
  return { path: path.replace(/\/+$/, '') || '/', params };
}

function matchRoute(method, path) {
  const routes = [
    { method: 'POST', pattern: '/api/v1/auth/login', handler: handleLogin },
    { method: 'POST', pattern: '/api/v1/auth/register', handler: handleRegister },
    { method: 'POST', pattern: '/api/v1/auth/refresh', handler: handleRefresh },
    { method: 'POST', pattern: '/api/v1/auth/change-password', handler: handleChangePassword },
    { method: 'GET', pattern: '/api/v1/users/cleaners', handler: handleGetCleaners },
    { method: 'GET', pattern: '/api/v1/users/stats', handler: handleUserStats },
    { method: 'GET', pattern: '/api/v1/users/me', handler: handleGetMe },
    { method: 'GET', pattern: '/api/v1/users/:id', handler: handleGetUser },
    { method: 'GET', pattern: '/api/v1/users', handler: handleListUsers },
    { method: 'GET', pattern: '/api/v1/services/summary', handler: handleServiceSummary },
    { method: 'GET', pattern: '/api/v1/services/status/:status', handler: handleServicesByStatus },
    { method: 'POST', pattern: '/api/v1/services/:id/reject', handler: handleRejectService },
    { method: 'POST', pattern: '/api/v1/services/:id/approve', handler: handleApproveService },
    { method: 'DELETE', pattern: '/api/v1/services/:id', handler: handleDeleteService },
    { method: 'PUT', pattern: '/api/v1/services/:id', handler: handleUpdateService },
    { method: 'GET', pattern: '/api/v1/services/:id', handler: handleGetService },
    { method: 'POST', pattern: '/api/v1/services', handler: handleCreateService },
    { method: 'GET', pattern: '/api/v1/services', handler: handleListServices },
    { method: 'GET', pattern: '/api/v1/assignments/summary', handler: handleAssignmentSummary },
    { method: 'GET', pattern: '/api/v1/assignments/my', handler: handleMyAssignments },
    { method: 'GET', pattern: '/api/v1/assignments/today', handler: handleTodayAssignments },
    { method: 'POST', pattern: '/api/v1/assignments/:id/start', handler: handleStartAssignment },
    { method: 'POST', pattern: '/api/v1/assignments/:id/complete', handler: handleCompleteAssignment },
    { method: 'POST', pattern: '/api/v1/assignments/:id/timer/start', handler: handleTimerStart },
    { method: 'POST', pattern: '/api/v1/assignments/:id/timer/stop', handler: handleTimerStop },
    { method: 'PUT', pattern: '/api/v1/assignments/:id/status', handler: handleUpdateAssignmentStatus },
    { method: 'GET', pattern: '/api/v1/assignments/:id', handler: handleGetAssignment },
    { method: 'POST', pattern: '/api/v1/assignments', handler: handleCreateAssignment },
    { method: 'GET', pattern: '/api/v1/assignments', handler: handleListAssignments },
    { method: 'POST', pattern: '/api/v1/reports/generate', handler: handleGenerateReport },
    { method: 'GET', pattern: '/api/v1/reports', handler: handleListReports },
    { method: 'GET', pattern: '/api/v1/checklist/assignment/:id', handler: handleGetChecklist },
    { method: 'PUT', pattern: '/api/v1/checklist/item/:id', handler: handleUpdateChecklistItem },
    { method: 'GET', pattern: '/api/v1/photos/upload-url', handler: handleUploadUrl },
    { method: 'GET', pattern: '/api/v1/photos/assignment/:id', handler: handleGetPhotos },
    { method: 'POST', pattern: '/api/v1/photos', handler: handleCreatePhoto },
    { method: 'POST', pattern: '/api/v1/location/log', handler: handleLocationLog },
    { method: 'POST', pattern: '/api/v1/checklists', handler: handleCreateChecklist },
    { method: 'GET', pattern: '/api/v1/checklists', handler: handleListChecklists },
    { method: 'DELETE', pattern: '/api/v1/checklists/:id', handler: handleDeleteChecklist },
    { method: 'PUT', pattern: '/api/v1/checklists/:id', handler: handleUpdateChecklist },
    { method: 'POST', pattern: '/api/v1/location/validate', handler: handleLocationValidate },
    { method: 'POST', pattern: '/api/v1/sync/enqueue', handler: handleSyncEnqueue },
    { method: 'GET', pattern: '/api/v1/sync/status', handler: handleSyncStatus },
    { method: 'GET', pattern: '/api/v1/notifications/unread-count', handler: handleNotificationsUnreadCount },
    { method: 'GET', pattern: '/api/v1/notifications', handler: handleListNotifications },
    { method: 'PUT', pattern: '/api/v1/notifications/mark-all-read', handler: handleMarkAllNotificationsRead },
    { method: 'PUT', pattern: '/api/v1/notifications/:id/read', handler: handleMarkNotificationRead },
    { method: 'GET', pattern: '/api/v1/location/assignment/:id', handler: handleLocationByAssignment },
    { method: 'GET', pattern: '/api/v1/location/alerts/:id', handler: handleLocationAlerts },
    { method: 'GET', pattern: '/api/v1/reports/:id/download', handler: handleDownloadReport },
    { method: 'GET', pattern: '/api/v1/reports/:id', handler: handleGetReport },
    { method: 'PUT', pattern: '/api/v1/services/:id/cancel', handler: handleCancelService },
  ];

  for (const route of routes) {
    const routeParts = route.pattern.split('/');
    const pathParts = path.split('/');
    if (routeParts.length !== pathParts.length) continue;
    const params = {};
    let match = true;
    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(':')) {
        params[routeParts[i].slice(1)] = pathParts[i];
      } else if (routeParts[i] !== pathParts[i]) {
        match = false;
        break;
      }
    }
    if (match && route.method === method) {
      return { handler: route.handler, params };
    }
  }
  return null;
}

let accessTokenCounter = 1;
function generateToken(user, type = 'access') {
  accessTokenCounter++;
  return `mock-${type}-token-${user.id}-${accessTokenCounter}`;
}

function bodyOnly(data) {
  const { headers, page, limit, ...rest } = data || {};
  return rest;
}

function enrichAssignment(a) {
  const s = SERVICES.find(s => s.id === a.serviceId);
  return {
    ...a,
    service: s ? { clientName: s.clientName, address: s.address, name: s.serviceType, serviceType: s.serviceType, latitude: s.latitude, longitude: s.longitude } : null,
    clientName: s?.clientName || a.clientName || '',
    clientAddress: s?.address || a.clientAddress || '',
    serviceType: s?.serviceType || '',
    name: a.name || s?.serviceType || 'Cleaning Service',
    latitude: s?.latitude || a.latitude || null,
    longitude: s?.longitude || a.longitude || null,
  };
}

function isCleanerRequest(headers) {
  const auth = headers?.authorization || '';
  return auth.includes('cleaner');
}

function stripPaymentData(obj) {
  if (!obj) return obj;
  if (Array.isArray(obj)) return obj.map(stripPaymentData);
  const { paymentCalculated, hourlyRateSnapshot, ...rest } = obj;
  return rest;
}

function handleLogin(body) {
  const user = USERS.find(u => u.email === body.email);
  if (!user || (body.password !== 'password123' && body.password !== 'admin123')) {
    return json({ statusCode: 401, message: 'Invalid credentials' }, 401);
  }
  return json({
    user: { ...user, mustChangePassword: false },
    tokens: { accessToken: generateToken(user, 'access'), refreshToken: generateToken(user, 'refresh') },
  });
}

function handleRegister(data) {
  const newUser = { id: `user-${Date.now()}`, ...bodyOnly(data), isActive: true, role: 'cleaner' };
  USERS.push(newUser);
  return json({ user: newUser, tokens: { accessToken: generateToken(newUser, 'access'), refreshToken: generateToken(newUser, 'refresh') } });
}

function handleRefresh() {
  return json({ tokens: { accessToken: generateToken({ id: 'admin-1' }, 'access'), refreshToken: generateToken({ id: 'admin-1' }, 'refresh') } });
}

function handleChangePassword() {
  return json({ data: { success: true, message: 'Password changed successfully' } });
}

function computeUserHours(userId) {
  const userAssignments = ASSIGNMENTS.filter(a => a.cleanerId === userId && a.totalMinutes != null && a.status === 'completed');
  const totalMinutes = userAssignments.reduce((sum, a) => sum + (a.totalMinutes || 0), 0);
  return Math.round((totalMinutes / 60) * 100) / 100;
}

function enrichUser(u) {
  return { ...u, totalHours: computeUserHours(u.id) };
}

function handleListUsers(params) {
  const page = parseInt(params.page || '1');
  const limit = parseInt(params.limit || '20');
  const sorted = [...USERS].reverse().map(enrichUser);
  return json({
    data: sorted.slice((page - 1) * limit, page * limit),
    meta: { total: USERS.length, page, limit, totalPages: Math.ceil(USERS.length / limit), hasNextPage: page * limit < USERS.length, hasPrevPage: page > 1 },
  });
}

function handleGetCleaners() {
  return json({ data: USERS.filter(u => u.role === 'cleaner').map(enrichUser) });
}

function handleUserStats() {
  const cleaners = USERS.filter(u => u.role === 'cleaner');
  return json({
    data: {
      total: USERS.length,
      admins: USERS.filter(u => u.role === 'admin').length,
      cleaners: cleaners.length,
      active: cleaners.filter(u => u.isActive).length,
    },
  });
}

function handleGetMe(data) {
  const auth = data.headers?.authorization || '';
  const tokenMatch = auth.match(/Bearer mock-access-token-(admin-\d+)/);
  const userId = tokenMatch ? tokenMatch[1] : 'admin-1';
  const user = USERS.find(u => u.id === userId) || USERS[0];
  return json({ data: enrichUser(user) });
}

function handleGetUser(data) {
  const user = USERS.find(u => u.id === data.id);
  if (!user) return json({ statusCode: 404, message: 'User not found' }, 404);
  return json({ data: enrichUser(user) });
}

function enrichService(svc) {
  const ass = ASSIGNMENTS.find(a => a.serviceId === svc.id);
  return {
    ...svc,
    cleanerId: ass?.cleanerId || null,
    cleanerName: ass?.cleanerName || null,
    assignmentId: ass?.id || null,
    assignmentStatus: ass?.status || null,
    checklistIncomplete: ass?.checklistIncomplete || false,
  };
}

function handleListServices(params) {
  const page = parseInt(params.page || '1');
  const limit = parseInt(params.limit || '20');
  const sorted = [...SERVICES].reverse();
  const enriched = sorted.map(enrichService);
  return json({
    data: enriched.slice((page - 1) * limit, page * limit),
    meta: { total: SERVICES.length, page, limit, totalPages: Math.ceil(SERVICES.length / limit), hasNextPage: page * limit < SERVICES.length, hasPrevPage: page > 1 },
  });
}

function handleCreateService(data) {
  const svc = { id: `svc-${Date.now()}`, ...bodyOnly(data), status: 'pending', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  SERVICES.unshift(svc);
  return json({ data: svc }, 201);
}

function handleGetService(data) {
  const svc = SERVICES.find(s => s.id === data.id);
  if (!svc) return json({ statusCode: 404, message: 'Service not found' }, 404);
  return json({ data: { ...svc, clientName: svc.clientName, clientPhone: svc.clientPhone, clientEmail: svc.clientEmail } });
}

function handleUpdateService(data) {
  const idx = SERVICES.findIndex(s => s.id === data.id);
  if (idx === -1) return json({ statusCode: 404, message: 'Service not found' }, 404);
  const { id, headers, page, limit, ...body } = data;
  SERVICES[idx] = { ...SERVICES[idx], ...body, updatedAt: new Date().toISOString() };
  return json({ data: SERVICES[idx] });
}

function handleDeleteService(data) {
  const idx = SERVICES.findIndex(s => s.id === data.id);
  if (idx === -1) return json({ statusCode: 404, message: 'Service not found' }, 404);
  SERVICES.splice(idx, 1);
  return json({ data: { success: true } });
}

function handleServicesByStatus(data) {
  const filtered = SERVICES.filter(s => s.status === data.status);
  return json({ data: filtered });
}

function handleServiceSummary() {
  return json({
    data: {
      total: SERVICES.length,
      pending: SERVICES.filter(s => s.status === 'pending').length,
      inProgress: SERVICES.filter(s => s.status === 'in_progress').length,
      pendingVerification: SERVICES.filter(s => s.status === 'pending_verification').length,
      completed: SERVICES.filter(s => s.status === 'completed').length,
      returned: SERVICES.filter(s => s.status === 'returned').length,
    },
  });
}

function handleApproveService(data) {
  const idx = SERVICES.findIndex(s => s.id === data.id);
  if (idx === -1) return json({ statusCode: 404, message: 'Service not found' }, 404);
  SERVICES[idx].status = 'completed';
  SERVICES[idx].updatedAt = new Date().toISOString();
  return json({ data: SERVICES[idx] });
}

function handleRejectService(data) {
  const idx = SERVICES.findIndex(s => s.id === data.id);
  if (idx === -1) return json({ statusCode: 404, message: 'Service not found' }, 404);
  SERVICES[idx].status = 'returned';
  SERVICES[idx].rejectionNote = data.rejectionNote || 'No reason provided';
  SERVICES[idx].updatedAt = new Date().toISOString();
  return json({ data: SERVICES[idx] });
}

function handleCreateAssignment(data) {
  const ass = { id: `ass-${Date.now()}`, ...bodyOnly(data), status: 'pending', createdAt: new Date().toISOString() };
  ASSIGNMENTS.unshift(ass);
  return json({ data: ass }, 201);
}

function handleMyAssignments(data) {
  const enriched = ASSIGNMENTS.filter(a => a.cleanerId === 'cleaner-1').map(enrichAssignment);
  const result = isCleanerRequest(data.headers) ? enriched.map(stripPaymentData) : enriched;
  return json({ data: result });
}

function handleTodayAssignments(data) {
  const enriched = ASSIGNMENTS.filter(a => a.scheduledDate === today || a.status === 'in_progress').map(enrichAssignment);
  const result = isCleanerRequest(data.headers) ? enriched.map(stripPaymentData) : enriched;
  return json({ data: result });
}

function handleGetAssignment(data) {
  const a = ASSIGNMENTS.find(a => a.id === data.id);
  if (!a) return json({ statusCode: 404, message: 'Assignment not found' }, 404);
  const enriched = enrichAssignment(a);
  const result = isCleanerRequest(data.headers) ? stripPaymentData(enriched) : enriched;
  return json({ data: result });
}

function handleListAssignments(data) {
  const enriched = ASSIGNMENTS.map(enrichAssignment);
  const result = isCleanerRequest(data?.headers) ? enriched.map(stripPaymentData) : enriched;
  return json({ data: result });
}

function handleStartAssignment(data) {
  const idx = ASSIGNMENTS.findIndex(a => a.id === data.id);
  if (idx === -1) return json({ statusCode: 404, message: 'Assignment not found' }, 404);
  ASSIGNMENTS[idx].status = 'in_progress';
  ASSIGNMENTS[idx].timerStart = new Date().toISOString();
  return json({ data: enrichAssignment(ASSIGNMENTS[idx]) });
}

function handleCompleteAssignment(data) {
  const idx = ASSIGNMENTS.findIndex(a => a.id === data.id);
  if (idx === -1) return json({ statusCode: 404, message: 'Assignment not found' }, 404);
  ASSIGNMENTS[idx].status = 'pending_verification';
  ASSIGNMENTS[idx].timerEnd = new Date().toISOString();
  const start = new Date(ASSIGNMENTS[idx].timerStart).getTime();
  const end = new Date(ASSIGNMENTS[idx].timerEnd).getTime();
  const minutes = Math.round((end - start) / 60000);
  ASSIGNMENTS[idx].totalMinutes = minutes;
  if (ASSIGNMENTS[idx].hourlyRateSnapshot) {
    ASSIGNMENTS[idx].paymentCalculated = Math.round((ASSIGNMENTS[idx].hourlyRateSnapshot / 60) * minutes * 100) / 100;
  }
  if (data.checklistIncomplete) {
    ASSIGNMENTS[idx].checklistIncomplete = true;
  }
  return json({ data: enrichAssignment(ASSIGNMENTS[idx]) });
}

function handleTimerStart(data) {
  const a = ASSIGNMENTS.find(a => a.id === data.id);
  if (!a) return json({ statusCode: 404, message: 'Assignment not found' }, 404);
  a.timerStart = new Date().toISOString();
  a.timerEnd = null;
  return json({ data: enrichAssignment(a) });
}

function handleTimerStop(data) {
  const a = ASSIGNMENTS.find(a => a.id === data.id);
  if (!a) return json({ statusCode: 404, message: 'Assignment not found' }, 404);
  a.timerEnd = new Date().toISOString();
  const start = new Date(a.timerStart).getTime();
  const end = new Date(a.timerEnd).getTime();
  const minutes = Math.round((end - start) / 60000);
  a.totalMinutes = minutes;
  if (a.hourlyRateSnapshot) {
    a.paymentCalculated = Math.round((a.hourlyRateSnapshot / 60) * minutes * 100) / 100;
  }
  return json({ data: enrichAssignment(a) });
}

function handleUpdateAssignmentStatus(data) {
  const idx = ASSIGNMENTS.findIndex(a => a.id === data.id);
  if (idx === -1) return json({ statusCode: 404, message: 'Assignment not found' }, 404);
  const { id, headers, ...body } = data;
  ASSIGNMENTS[idx] = { ...ASSIGNMENTS[idx], ...body, status: data.status || ASSIGNMENTS[idx].status };
  return json({ data: enrichAssignment(ASSIGNMENTS[idx]) });
}

function handleAssignmentSummary() {
  return json({
    data: {
      total: ASSIGNMENTS.length,
      pending: ASSIGNMENTS.filter(a => a.status === 'pending').length,
      inProgress: ASSIGNMENTS.filter(a => a.status === 'in_progress').length,
      pendingVerification: ASSIGNMENTS.filter(a => a.status === 'pending_verification').length,
      completed: ASSIGNMENTS.filter(a => a.status === 'completed').length,
      returned: ASSIGNMENTS.filter(a => a.status === 'returned').length,
    },
  });
}

function handleListReports(params) {
  const page = parseInt(params.page || '1');
  const limit = parseInt(params.limit || '20');
  const sorted = [...REPORTS].reverse();
  return json({
    data: sorted.slice((page - 1) * limit, page * limit),
    meta: { total: REPORTS.length, page, limit, totalPages: Math.ceil(REPORTS.length / limit), hasNextPage: page * limit < REPORTS.length, hasPrevPage: page > 1 },
  });
}

function handleGenerateReport(data) {
  const completedOnly = data.completedOnly !== false;
  let filteredAssignments = ASSIGNMENTS;
  if (completedOnly) {
    filteredAssignments = ASSIGNMENTS.filter(a => a.status === 'completed');
  }
  const totalPay = filteredAssignments.reduce((sum, a) => sum + (a.paymentCalculated || 0), 0);
  const totalHours = filteredAssignments.reduce((sum, a) => sum + ((a.totalMinutes || 0) / 60), 0);
  const rep = {
    id: `rep-${Date.now()}`,
    ...bodyOnly(data),
    filename: `report-${data.type}-${data.dateFrom}-${data.dateTo}.${data.format}`,
    generatedBy: 'admin-1',
    createdAt: new Date().toISOString(),
    stats: {
      completedJobs: filteredAssignments.length,
      totalPay: Math.round(totalPay * 100) / 100,
      totalHours: Math.round(totalHours * 100) / 100,
    },
  };
  REPORTS.unshift(rep);
  return json({ data: rep }, 201);
}

function handleGetReport(data) {
  const rep = REPORTS.find(r => r.id === data.id);
  if (!rep) return json({ statusCode: 404, message: 'Report not found' }, 404);
  return json({ data: rep });
}

function handleDownloadReport(data) {
  const rep = REPORTS.find(r => r.id === data.id);
  if (!rep) return json({ statusCode: 404, message: 'Report not found' }, 404);
  const content = rep.format === 'csv'
    ? 'Client,Service,Date,Status\nResidencial Los Olivos,Regular,2026-05-24,Pending\nOficinas Centro,Deep Clean,2026-05-24,In Progress'
    : `Mock ${rep.format.toUpperCase()} report content for ${rep.filename}`;
  return {
    status: 200,
    headers: {
      'Content-Type': rep.format === 'csv' ? 'text/csv' : rep.format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf',
      'Content-Disposition': `attachment; filename="${rep.filename}"`,
    },
    body: JSON.stringify({ data: { content, filename: rep.filename } }),
  };
}

function handleCancelService(data) {
  const idx = SERVICES.findIndex(s => s.id === data.id);
  if (idx === -1) return json({ statusCode: 404, message: 'Service not found' }, 404);
  SERVICES[idx].status = 'cancelled';
  SERVICES[idx].updatedAt = new Date().toISOString();
  const assIdx = ASSIGNMENTS.findIndex(a => a.serviceId === data.id);
  if (assIdx !== -1) {
    ASSIGNMENTS[assIdx].status = 'cancelled';
  }
  return json({ data: SERVICES[idx] });
}

function handleGetChecklist(data) {
  const assignmentId = data.id;
  if (!CHECKLISTS[assignmentId]) {
    CHECKLISTS[assignmentId] = [
      { id: `cl-${assignmentId}-1`, assignmentId, templateItemId: 'ti-1', label: 'Barrer y trapear pisos', status: 'completed', notes: '', completedBy: 'cleaner-1', completedAt: new Date().toISOString(), order: 1, required: true, category: 'floors' },
      { id: `cl-${assignmentId}-2`, assignmentId, templateItemId: 'ti-2', label: 'Limpiar baños', status: 'in_progress', notes: '', completedBy: null, completedAt: null, order: 2, required: true, category: 'bathrooms' },
      { id: `cl-${assignmentId}-3`, assignmentId, templateItemId: 'ti-3', label: 'Aspirar alfombras', status: 'pending', notes: '', completedBy: null, completedAt: null, order: 3, required: false, category: 'floors' },
      { id: `cl-${assignmentId}-4`, assignmentId, templateItemId: 'ti-4', label: 'Limpiar ventanas', status: 'pending', notes: '', completedBy: null, completedAt: null, order: 4, required: false, category: 'windows' },
      { id: `cl-${assignmentId}-5`, assignmentId, templateItemId: 'ti-5', label: 'Desinfectar superficies', status: 'completed', notes: '', completedBy: 'cleaner-1', completedAt: new Date().toISOString(), order: 5, required: true, category: 'surfaces' },
      { id: `cl-${assignmentId}-6`, assignmentId, templateItemId: 'ti-6', label: 'Vaciar basureros', status: 'pending', notes: '', completedBy: null, completedAt: null, order: 6, required: true, category: 'general' },
      { id: `cl-${assignmentId}-7`, assignmentId, templateItemId: 'ti-7', label: 'Limpiar cocina', status: 'pending', notes: '', completedBy: null, completedAt: null, order: 7, required: true, category: 'kitchen' },
      { id: `cl-${assignmentId}-8`, assignmentId, templateItemId: 'ti-8', label: 'Reponer insumos', status: 'pending', notes: '', completedBy: null, completedAt: null, order: 8, required: false, category: 'supplies' },
    ];
  }
  return json({ data: CHECKLISTS[assignmentId] });
}

function handleUpdateChecklistItem(data) {
  const { id, ...rest } = data;
  return json({ data: { id, ...bodyOnly(rest), updatedAt: new Date().toISOString() } });
}

function handleUploadUrl() {
  return json({ data: { url: 'https://mock-minio/corecon/photos/upload.jpg', key: 'photos/upload.jpg' } });
}

function handleGetPhotos() {
  return json({ data: [] });
}

function handleCreatePhoto(data) {
  return json({ data: { id: `photo-${Date.now()}`, ...bodyOnly(data), createdAt: new Date().toISOString() } }, 201);
}

const CHECKLIST_TEMPLATES = [];

function handleCreateChecklist(data) {
  const template = { id: `ct-${Date.now()}`, ...bodyOnly(data), createdAt: new Date().toISOString() };
  CHECKLIST_TEMPLATES.unshift(template);
  return json({ data: template }, 201);
}

function handleListChecklists() {
  return json({ data: CHECKLIST_TEMPLATES });
}

function handleDeleteChecklist(data) {
  const idx = CHECKLIST_TEMPLATES.findIndex(t => t.id === data.id);
  if (idx === -1) return json({ statusCode: 404, message: 'Checklist not found' }, 404);
  CHECKLIST_TEMPLATES.splice(idx, 1);
  return json({ data: { success: true } });
}

function handleUpdateChecklist(data) {
  const idx = CHECKLIST_TEMPLATES.findIndex(t => t.id === data.id);
  if (idx === -1) return json({ statusCode: 404, message: 'Checklist not found' }, 404);
  const { id, headers, ...body } = data;
  CHECKLIST_TEMPLATES[idx] = { ...CHECKLIST_TEMPLATES[idx], ...body, updatedAt: new Date().toISOString() };
  return json({ data: CHECKLIST_TEMPLATES[idx] });
}

function handleLocationLog() {
  return json({ data: { success: true } });
}

function handleLocationValidate() {
  return json({ data: { valid: true, distance: 25, isWithinRadius: true } });
}

function handleSyncEnqueue() {
  return json({ data: { success: true, queued: 1 } });
}

function handleSyncStatus() {
  return json({ data: { pending: 0, lastSync: new Date().toISOString() } });
}

const MOCK_NOTIFICATIONS = [
  { id: 'notif-1', userId: 'admin-1', recipientId: null, type: 'service_pending_verification', title: 'Pending Verification', body: 'Departamento Norte has been submitted for review by Ana Martínez.', data: { serviceId: 'svc-4', cleanerName: 'Ana Martínez' }, relatedServiceId: 'svc-4', relatedAlertId: null, read: false, createdAt: new Date(Date.now() - 300000).toISOString(), readAt: null },
  { id: 'notif-2', userId: 'admin-1', recipientId: null, type: 'service_pending_verification', title: 'Pending Verification', body: 'Oficinas TechCorp has been submitted for review by Pedro Ramírez.', data: { serviceId: 'svc-9', cleanerName: 'Pedro Ramírez' }, relatedServiceId: 'svc-9', relatedAlertId: null, read: false, createdAt: new Date(Date.now() - 600000).toISOString(), readAt: null },
  { id: 'notif-3', userId: 'admin-1', recipientId: null, type: 'service_completed', title: 'Service Completed', body: 'Casa Rodríguez was approved and completed.', data: { serviceId: 'svc-3' }, relatedServiceId: 'svc-3', relatedAlertId: null, read: true, createdAt: new Date(Date.now() - 86400000).toISOString(), readAt: new Date().toISOString() },
  { id: 'notif-4', userId: 'admin-1', recipientId: null, type: 'service_returned', title: 'Service Returned', body: 'Casa Hurtado was returned to Juan Pérez for corrections.', data: { serviceId: 'svc-10' }, relatedServiceId: 'svc-10', relatedAlertId: null, read: false, createdAt: new Date(Date.now() - 900000).toISOString(), readAt: null },
  { id: 'notif-5', userId: 'cleaner-1', recipientId: null, type: 'service_returned', title: 'Service Returned', body: 'Casa Hurtado was returned. Please review the admin note and resubmit.', data: { serviceId: 'svc-10', rejectionNote: 'Faltó limpiar ventanas del segundo piso.' }, relatedServiceId: 'svc-10', relatedAlertId: null, read: false, createdAt: new Date(Date.now() - 900000).toISOString(), readAt: null },
  { id: 'notif-6', userId: 'cleaner-1', recipientId: null, type: 'service_started', title: 'Service Started', body: 'Residencial Los Olivos is scheduled for today at 08:00.', data: { serviceId: 'svc-1' }, relatedServiceId: 'svc-1', relatedAlertId: null, read: true, createdAt: new Date(Date.now() - 7200000).toISOString(), readAt: new Date().toISOString() },
];

function handleListNotifications(params) {
  const page = parseInt(params.page || '1');
  const limit = parseInt(params.limit || '50');
  const userId = params.headers?.authorization?.includes('cleaner') ? 'cleaner-1' : 'admin-1';
  const userNotifs = MOCK_NOTIFICATIONS.filter(n => n.userId === userId || n.userId === 'admin-1');
  const sorted = [...userNotifs].reverse();
  return json({
    data: sorted.slice((page - 1) * limit, page * limit),
    meta: { total: sorted.length, page, limit },
  });
}

function handleNotificationsUnreadCount(data) {
  const userId = data.headers?.authorization?.includes('cleaner') ? 'cleaner-1' : 'admin-1';
  const count = MOCK_NOTIFICATIONS.filter(n => (n.userId === userId || n.userId === 'admin-1') && !n.read).length;
  return json({ count });
}

function handleMarkNotificationRead(data) {
  const n = MOCK_NOTIFICATIONS.find(n => n.id === data.id);
  if (n) { n.read = true; n.readAt = new Date().toISOString(); }
  return json({ data: { success: true } });
}

function handleMarkAllNotificationsRead(data) {
  const userId = data.headers?.authorization?.includes('cleaner') ? 'cleaner-1' : 'admin-1';
  MOCK_NOTIFICATIONS.filter(n => (n.userId === userId || n.userId === 'admin-1')).forEach(n => { n.read = true; n.readAt = new Date().toISOString(); });
  return json({ data: { success: true } });
}

const LOCATION_LOGS = [
  { id: 'loc-1', userId: 'cleaner-1', assignmentId: 'ass-1', latitude: -33.4489, longitude: -70.6693, accuracy: 15, timestamp: new Date(Date.now() - 600000).toISOString(), isWithinRadius: true, isSynced: true, createdAt: new Date().toISOString() },
  { id: 'loc-2', userId: 'cleaner-1', assignmentId: 'ass-1', latitude: -33.4489, longitude: -70.6693, accuracy: 12, timestamp: new Date(Date.now() - 300000).toISOString(), isWithinRadius: true, isSynced: true, createdAt: new Date().toISOString() },
  { id: 'loc-3', userId: 'cleaner-1', assignmentId: 'ass-1', latitude: -33.4490, longitude: -70.6695, accuracy: 10, timestamp: new Date(Date.now() - 120000).toISOString(), isWithinRadius: true, isSynced: true, createdAt: new Date().toISOString() },
  { id: 'loc-4', userId: 'cleaner-1', assignmentId: 'ass-4', latitude: -33.4560, longitude: -70.6500, accuracy: 20, timestamp: new Date(Date.now() - 900000).toISOString(), isWithinRadius: true, isSynced: true, createdAt: new Date().toISOString() },
  { id: 'loc-5', userId: 'cleaner-1', assignmentId: 'ass-4', latitude: -33.4562, longitude: -70.6503, accuracy: 18, timestamp: new Date(Date.now() - 600000).toISOString(), isWithinRadius: true, isSynced: true, createdAt: new Date().toISOString() },
];

function handleLocationByAssignment(data) {
  const logs = LOCATION_LOGS.filter(l => l.assignmentId === data.id);
  return json({ data: logs });
}

function handleLocationAlerts(data) {
  return json({ data: [] });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

const server = http.createServer((req, res) => {
  const { path, params: queryParams } = parseUrl(req.url);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders());
    res.end();
    return;
  }

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    const parsedBody = body ? (() => { try { return JSON.parse(body); } catch { return {}; } })() : {};
    const match = matchRoute(req.method, path);

    if (!match) {
      console.log(`[MOCK] 404 ${req.method} ${path}`);
      res.writeHead(404, { ...corsHeaders(), 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ statusCode: 404, message: `Mock: ${req.method} ${path} not found` }));
      return;
    }

    try {
      const merged = { ...queryParams, ...parsedBody, ...match.params, headers: req.headers };
      const result = match.handler(merged);
      console.log(`[MOCK] ${req.method} ${path} → ${result.status}`);
      res.writeHead(result.status || 200, { ...corsHeaders(), ...(result.headers || {}), 'Content-Type': 'application/json' });
      res.end(result.body);
    } catch (err) {
      console.error(`[MOCK] Error:`, err);
      res.writeHead(500, { ...corsHeaders(), 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ statusCode: 500, message: 'Mock server error' }));
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`\n  🎯 Mock API running at http://${HOST}:${PORT}`);
  console.log(`  Login: admin@corecon.us / admin123`);
  console.log(`  Login: cleaner@corecon.us / password123\n`);
});
