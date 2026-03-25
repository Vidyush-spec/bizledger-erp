const BL_API = 'https://bizledger-erp-production.up.railway.app/api';

const blAuth = {
  getToken : () => localStorage.getItem('bl_token'),
  getUser  : () => { try { return JSON.parse(localStorage.getItem('bl_user')); } catch { return null; } },
  setToken : (t) => localStorage.setItem('bl_token', t),
  setUser  : (u) => localStorage.setItem('bl_user', JSON.stringify(u)),
  clear    : () => { localStorage.removeItem('bl_token'); localStorage.removeItem('bl_user'); },
  isLoggedIn: () => !!localStorage.getItem('bl_token'),
};

async function blRequest(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = blAuth.getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(BL_API + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) { blAuth.clear(); window.location.href = '/login.html'; return; }
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'API error ' + res.status);
  return data;
}

const blAuthApi = {
  login: async (email, password) => {
    const data = await blRequest('POST', '/auth/login', { email, password });
    blAuth.setToken(data.token);
    blAuth.setUser(data.user);
    return data;
  },
  logout: async () => {
    try { await blRequest('POST', '/auth/logout', {}); } catch {}
    blAuth.clear();
    window.location.href = '/login.html';
  },
  me: () => blRequest('GET', '/auth/me'),
};

const blInvoices = {
  list   : (status) => blRequest('GET', '/invoices' + (status ? '?status=' + status : '')),
  get    : (id)     => blRequest('GET', '/invoices/' + id),
  create : (data)   => blRequest('POST', '/invoices', data),
  update : (id, d)  => blRequest('PUT', '/invoices/' + id, d),
  delete : (id)     => blRequest('DELETE', '/invoices/' + id),
};

const blEmployees = {
  list   : ()       => blRequest('GET', '/employees'),
  get    : (id)     => blRequest('GET', '/employees/' + id),
  create : (data)   => blRequest('POST', '/employees', data),
  update : (id, d)  => blRequest('PUT', '/employees/' + id, d),
  delete : (id)     => blRequest('DELETE', '/employees/' + id),
};

const blProducts = {
  list   : ()       => blRequest('GET', '/products'),
  get    : (id)     => blRequest('GET', '/products/' + id),
  create : (data)   => blRequest('POST', '/products', data),
  update : (id, d)  => blRequest('PUT', '/products/' + id, d),
  delete : (id)     => blRequest('DELETE', '/products/' + id),
};

const blUsers = {
  list   : ()       => blRequest('GET', '/users'),
  create : (data)   => blRequest('POST', '/users', data),
  update : (id, d)  => blRequest('PUT', '/users/' + id, d),
};

function blRequireAuth() {
  if (!blAuth.isLoggedIn()) window.location.href = '/login.html';
}

function blRenderUser() {
  const user = blAuth.getUser();
  if (!user) return;
  const name   = document.getElementById('bl-user-name');
  const role   = document.getElementById('bl-user-role');
  const avatar = document.getElementById('bl-user-avatar');
  if (name)   name.textContent   = user.name;
  if (role)   role.textContent   = user.role;
  if (avatar) avatar.textContent = user.avatar || user.name.slice(0,2).toUpperCase();
}