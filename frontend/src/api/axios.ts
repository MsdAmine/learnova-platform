import axios from 'axios';

const DEFAULT_API_BASE_URL = 'http://localhost:8080';

function resolveApiBaseUrl() {
    const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
    return configuredBaseUrl.replace(/\/+$/, '').replace(/\/api\/v1$/, '');
}

// No default Content-Type header: axios sets 'application/json' automatically
// for plain-object request bodies, and clears it for FormData so the browser
// can attach the correct multipart boundary. A hard-coded default here would
// leak into multipart upload requests and break them server-side.
const api = axios.create({
    baseURL: resolveApiBaseUrl(),
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ── Response interceptor setup ────────────────────────────────────────────────
// Cannot use React hooks here — this is a plain module.
// Call setupApiInterceptors() from inside the router tree (ApiInterceptorSetup)
// where useNavigate() and useAuth() are available.

type ApiInterceptorHandlers = {
    onUnauthorized: () => void;
    onForbidden: () => void;
};

let responseInterceptorId: number | null = null;

export function setupApiInterceptors(handlers: ApiInterceptorHandlers): () => void {
    if (responseInterceptorId !== null) {
        api.interceptors.response.eject(responseInterceptorId);
    }

    responseInterceptorId = api.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response) {
                if (error.response.status === 401) {
                    handlers.onUnauthorized();
                } else if (error.response.status === 403) {
                    handlers.onForbidden();
                }
            }
            return Promise.reject(error);
        },
    );

    return () => {
        if (responseInterceptorId !== null) {
            api.interceptors.response.eject(responseInterceptorId);
            responseInterceptorId = null;
        }
    };
}

export default api;
