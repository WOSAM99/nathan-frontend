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
  full_name: string;
}

interface User {
  id: string;
  email: string;
  name: string;
}

interface Project {
  property_id: string;
  user_id: string;
  created_at: string;
  total_images: number;
  thumbnail_url?: string;
  pdf_urls: string[];
}

interface PropertyImage {
  id: string;
  filename: string;
  page: number;
  caption: string;
  mime_type: string;
  file_type?: string;
  category?: string;
  url?: string; // Optional if available directly
}

interface PropertyDetails {
  property_id: string;
  user_id: string;
  // Backend returns separate lists
  mls_images: PropertyImage[];
  comps_images: PropertyImage[];
  pdf_urls: string[];
  created_at: string;
  chat_history: any[];
}

interface Room {
  id: string;
  name: string;
  type: string;
  image_count: number;
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
  image_ids: string[];
  user_feedback: string;
}

interface ChatRegenerateResponse {
  regenerated_images: Array<{ url: string; mime_type: string }>;
  description: string;
  input_count: number;
  message: string;
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  private unwrapResponse<T>(response: any): T {
    // Backend wraps responses in {success, data, message}
    if (response.success === false) {
      throw new Error(response.message || 'API Error');
    }
    // Return data field if it exists, otherwise return response as-is
    return (response.data !== undefined ? response.data : response) as T;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Always get fresh tokens from localStorage
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');

    console.log(`[API] ${options.method || 'GET'} ${endpoint}`, {
      hasAccessToken: !!this.accessToken,
      tokenPreview: this.accessToken?.substring(0, 20) + '...'
    });

    // Create headers object with proper typing
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Merge any existing headers from options
    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    // Add Authorization header if token exists
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
      console.log(`[API] Authorization header set:`, headers['Authorization'].substring(0, 30) + '...');
    } else {
      console.warn(`[API] No access token available for ${endpoint}`);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include', // Include cookies for refresh token
    });

    // Don't automatically refresh on 401 - let the error propagate
    // Only refresh when we get a specific "token expired" error
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error(`[API] Error ${response.status}:`, error.message);
      // Backend uses 'message' field for errors, not 'detail'
      throw new Error(error.message || `API Error: ${response.status}`);
    }

    const json = await response.json();
    return this.unwrapResponse<T>(json);
  }

  private async refreshTokens(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Send HttpOnly cookie automatically
        // No body - backend uses cookie
      });

      if (!response.ok) {
        this.clearTokens();
        return false;
      }

      const json = await response.json();
      const tokens = this.unwrapResponse<AuthTokens>(json);
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
    console.log('Login response tokens:', tokens);
    this.setTokens(tokens);
    return tokens;
  }

  async register(data: RegisterRequest): Promise<AuthTokens> {
    const tokens = await this.request<AuthTokens>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    console.log('Register response tokens:', tokens);
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
    const response = await this.request<any[]>('/doc/projects');
    // Map backend PropertyData to frontend Project interface
    return response.map(p => ({
      property_id: p.property_id,
      user_id: p.user_id,
      created_at: p.created_at,
      total_images: (p.files || []).length, // Fallback for list view
      thumbnail_url: p.files?.[0]?.id ? this.getImageUrl(p.files[0].id) : undefined,
      pdf_urls: p.pdf_urls || []
    }));
  }

  async getPropertyDetails(propertyId: string): Promise<PropertyDetails> {
    return this.request<PropertyDetails>(`/doc/${propertyId}`);
  }

  async uploadPDF(files: File[], propertyId: string, fileType: 'mls' | 'comps' = 'mls'): Promise<{ success: boolean; message: string; property_id: string }> {
    // Always get fresh token from localStorage
    this.accessToken = localStorage.getItem('access_token');

    const formData = new FormData();
    // Always send property_id (generate UUID if new)
    const actualPropertyId = propertyId === 'new'
      ? crypto.randomUUID()
      : propertyId;
    formData.append('property_id', actualPropertyId);
    formData.append('file_type', fileType);

    files.forEach(file => formData.append('files', file));

    const response = await fetch(`${API_BASE_URL}/doc/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        // Content-Type not set for FormData
      },
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message);
    }

    const json = await response.json();
    const unwrapped = this.unwrapResponse<any>(json);

    return {
      success: true,
      message: unwrapped.message || 'Upload successful',
      property_id: unwrapped.property_id
    };
  }

  // Alias for backward compatibility if needed, but updated signature is better
  async uploadDocument(propertyId: string, files: File[], notes?: string, fileType: 'mls' | 'comps' = 'mls'): Promise<{ success: boolean; message: string; property_id: string }> {
    return this.uploadPDF(files, propertyId, fileType);
  }

  async updateImageCategory(propertyId: string, imageId: string, category: string): Promise<any> {
    return this.request(`/doc/image/${propertyId}/${imageId}/category`, {
      method: 'PUT',
      body: JSON.stringify({ category }),
    });
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
