const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const getAuthHeader = () => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('sih_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // If unauthorized on protected endpoint, clear stale token and notify app
      if (
        res.status === 401 &&
        typeof window !== 'undefined' &&
        !endpoint.includes('/auth/login') &&
        !endpoint.includes('/auth/staff-login') &&
        !endpoint.includes('/auth/send-otp') &&
        !endpoint.includes('/auth/verify-otp')
      ) {
        localStorage.removeItem('sih_token');
        localStorage.removeItem('sih_user');
        window.dispatchEvent(new Event('authChange'));
        window.location.href = '/';
      }

      const err = new Error(data.message || data.error || `HTTP error ${res.status}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
};
