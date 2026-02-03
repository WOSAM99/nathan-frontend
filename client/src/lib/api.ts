const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

interface User {
  id: string;
  email: string;
  name: string;
}

interface Project {
  property_id: string;
  name: string;
  address: string;
  status: string;
  created_at: string;
  updated_at: string;
  thumbnail_url?: string;
}

interface PropertyDetails {
  property_id: string;
  name: string;
  address: string;
  status: string;
  rooms: Room[];
  images: PropertyImage[];
  iterations: Iteration[];
}

interface Room {
  id: string;
  name: string;
  type: string;
  image_count: number;
}

interface PropertyImage {
  id: string;
  url: string;
  room_id?: string;
  category?: string;
  created_at: string;
}

interface Iteration {
  id: string;
  version: string;
  label: string;
  image_url: string;
  created_at: string;
  prompt?: string;
}

interface ChatRegenerateRequest {
  property_id: string;
  room_id: string;
  prompt: string;
  reference_images?: string[];
}

interface ChatRegenerateResponse {
  iteration_id: string;
  image_url: string;
  version: string;
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401 && this.refreshToken) {
      const refreshed = await this.refreshTokens();
      if (refreshed) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
        const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
        });
        if (!retryResponse.ok) {
          throw new Error(`API Error: ${retryResponse.status}`);
        }
        return retryResponse.json();
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `API Error: ${response.status}`);
    }

    return response.json();
  }

  private async refreshTokens(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: this.refreshToken }),
      });

      if (!response.ok) {
        this.clearTokens();
        return false;
      }

      const tokens: AuthTokens = await response.json();
      this.setTokens(tokens);
      return true;
    } catch {
      this.clearTokens();
      return false;
    }
  }

  setTokens(tokens: AuthTokens) {
    this.accessToken = tokens.access_token;
    this.refreshToken = tokens.refresh_token;
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  async login(data: LoginRequest): Promise<AuthTokens> {
    const tokens = await this.request<AuthTokens>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setTokens(tokens);
    return tokens;
  }

  async register(data: RegisterRequest): Promise<AuthTokens> {
    const tokens = await this.request<AuthTokens>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setTokens(tokens);
    return tokens;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.clearTokens();
    }
  }

  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>('/doc/projects');
  }

  async getPropertyDetails(propertyId: string): Promise<PropertyDetails> {
    return this.request<PropertyDetails>(`/doc/${propertyId}`);
  }

  async uploadDocument(propertyId: string, files: File[]): Promise<{ success: boolean; message: string }> {
    const formData = new FormData();
    formData.append('property_id', propertyId);
    files.forEach(file => formData.append('files', file));

    const response = await fetch(`${API_BASE_URL}/doc/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(error.detail);
    }

    return response.json();
  }

  async regenerateDesign(data: ChatRegenerateRequest): Promise<ChatRegenerateResponse> {
    return this.request<ChatRegenerateResponse>('/chat/regenerate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getImageUrl(imageId: string): string {
    return `${API_BASE_URL}/doc/image/${imageId}`;
  }
}

export const api = new ApiClient();

export type {
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  User,
  Project,
  PropertyDetails,
  Room,
  PropertyImage,
  Iteration,
  ChatRegenerateRequest,
  ChatRegenerateResponse,
};
