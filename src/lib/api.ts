import axios from 'axios';

export const API_BASE = '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Interceptor to attach JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('neuro_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export async function apiFetch<T>(endpoint: string, options: any = {}): Promise<T> {
  const { body, ...rest } = options;
  
  try {
    const config = {
      ...rest,
      data: body,
      url: endpoint,
    };
    
    // Default method to GET if body isn't provided and method isn't specified, else POST if body is provided
    if (!config.method) {
        config.method = body ? 'POST' : 'GET';
    }

    const response = await apiClient.request<T>(config);
    return response.data;
  } catch (error: any) {
    if (error.response) {
       // Auto-logout on 401
       if (error.response.status === 401 && !endpoint.includes('/auth')) {
         localStorage.removeItem('neuro_token');
         window.location.href = '/setup'; // Redirect to setup/login
       }
       throw new Error(error.response.data.error || error.response.data.detail || `HTTP error ${error.response.status}`);
    }
    throw error;
  }
}
