const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

async function client(endpoint, { body, ...customConfig } = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    method: customConfig.method || (body ? 'POST' : 'GET'),
    ...customConfig,
    headers: {
      ...headers,
      ...customConfig.headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, config);
  let data;
  
  // Handle empty responses or non-JSON responses
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
    // Return text response directly if it's not JSON (e.g., CSV, HTML ticket)
    if (response.ok) {
        return data;
    }
  }

  if (response.ok) {
    return data;
  }

  const errorMessage = data?.message || response.statusText;
  
  // Handle unauthorized gracefully, but avoid redirect loops
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-error'));
  }

  return Promise.reject(new Error(errorMessage));
}

client.get = function(endpoint, customConfig = {}) {
  return client(endpoint, { ...customConfig, method: 'GET' });
};

client.post = function(endpoint, body, customConfig = {}) {
  return client(endpoint, { ...customConfig, method: 'POST', body });
};

client.put = function(endpoint, body, customConfig = {}) {
  return client(endpoint, { ...customConfig, method: 'PUT', body });
};

client.delete = function(endpoint, customConfig = {}) {
  return client(endpoint, { ...customConfig, method: 'DELETE' });
};

export default client;
