import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// API Configuration
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api.noliassurance.ci/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// Create axios instance
class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create(API_CONFIG);
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request ID for tracking
        config.headers['X-Request-ID'] = this.generateRequestId();

        // Add timestamp
        config.headers['X-Timestamp'] = new Date().toISOString();

        return config;
      },
      (error: AxiosError) => {
        logger.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        // Transform successful responses
        return this.transformResponse(response);
      },
      (error: AxiosError) => {
        // Handle errors
        return this.handleError(error);
      }
    );
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private transformResponse<T>(response: AxiosResponse<T>): ApiResponse<T> {
    const apiResponse: ApiResponse<T> = {
      success: true,
      data: response.data,
      timestamp: new Date().toISOString(),
    };

    return apiResponse;
  }

  private handleError(error: AxiosError): Promise<ApiResponse> {
    const apiError: ApiError = {
      code: 'NETWORK_ERROR',
      message: error.message || 'Une erreur réseau est survenue',
      timestamp: new Date().toISOString(),
    };

    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      apiError.code = `HTTP_${status}`;

      if (data && typeof data === 'object') {
        if ('message' in data) {
          apiError.message = (data as any).message;
        }
        if ('errors' in data) {
          apiError.details = (data as any).errors;
        }
        if ('code' in data) {
          apiError.code = (data as any).code;
        }
      }

      // Handle specific HTTP status codes
      switch (status) {
        case 401:
          this.handleUnauthorized();
          break;
        case 403:
          this.handleForbidden();
          break;
        case 404:
          apiError.message = 'Ressource non trouvée';
          break;
        case 422:
          apiError.message = 'Données invalides';
          break;
        case 500:
          apiError.message = 'Erreur serveur interne';
          break;
        case 503:
          apiError.message = 'Service temporairement indisponible';
          break;
        default:
          apiError.message = `Erreur ${status}: ${error.message}`;
      }
    } else if (error.request) {
      // No response received
      apiError.code = 'NO_RESPONSE';
      apiError.message = 'Aucune réponse du serveur';
    }

    // Log error for debugging
    logger.error('API Error:', {
      code: apiError.code,
      message: apiError.message,
      details: apiError.details,
      timestamp: apiError.timestamp,
    });

    return Promise.reject({
      success: false,
      error: apiError,
      timestamp: apiError.timestamp,
    });
  }

  private handleUnauthorized() {
    // Clear auth token and redirect to login
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');

    // Redirect to login page if not already there
    if (!window.location.pathname.includes('/auth/connexion')) {
      window.location.href = '/auth/connexion';
    }
  }

  private handleForbidden() {
    // Handle forbidden access
    logger.error('Access forbidden - insufficient permissions');
  }

  // Generic HTTP methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.instance.get(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.instance.post(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.instance.put(url, data, config);
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.instance.patch(url, data, config);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.instance.delete(url, config);
  }

  // File upload
  async upload<T = any>(url: string, file: File, additionalData?: Record<string, any>, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
    }

    return this.instance.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Paginated requests
  async getPaginated<T = any>(url: string, params?: PaginationParams & Record<string, any>): Promise<ApiResponse<PaginatedResponse<T>>> {
    return this.get(url, { params });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string; version: string }>> {
    return this.get('/health');
  }

  // Get API info
  async getApiInfo(): Promise<ApiResponse<{ version: string; environment: string; features: string[] }>> {
    return this.get('/info');
  }
}

// Create and export singleton instance
export const apiClient = new ApiClient();

// Export the instance for direct use
export default apiClient.instance;