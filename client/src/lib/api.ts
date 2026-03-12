import {
  AuthTokens,
  ChatRegenerateRequest,
  ChatRegenerateResponse,
  LoginRequest,
  LoginResponse,
  Project,
  PropertyDetails,
  RegisterRequest,
} from "@/types";

const API_BASE_URL = import.meta.env.API_BASE_URL || "http://3.13.32.73:8000";

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.accessToken = localStorage.getItem("access_token");
    this.refreshToken = localStorage.getItem("refresh_token");
  }

  private unwrapResponse<T>(response: any): T {
    // Backend wraps responses in {success, data, message}
    if (response.success === false) {
      throw new Error(response.message || "API Error");
    }
    // Return data field if it exists, otherwise return response as-is
    return (response.data !== undefined ? response.data : response) as T;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    // Always get fresh tokens from localStorage
    this.accessToken = localStorage.getItem("access_token");
    this.refreshToken = localStorage.getItem("refresh_token");

    // Create headers object with proper typing
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true", // Bypass ngrok browser warning page
    };

    // Merge any existing headers from options
    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    // Add Authorization header if token exists
    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: "omit", // Must be "omit" when backend uses Access-Control-Allow-Origin: * (wildcard)
    });

    // Don't automatically refresh on 401 - let the error propagate
    // Only refresh when we get a specific "token expired" error
    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Unknown error" }));
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
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        credentials: "omit", // Must be "omit" when backend uses Access-Control-Allow-Origin: *
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
    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem("access_token");
  }

  async login(data: LoginRequest): Promise<LoginResponse> {
    const res = await this.request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });

    // store only tokens in token storage
    this.setTokens({
      access_token: res.access_token,
      refresh_token: res.refresh_token,
    });

    return res;
  }

  async register(data: RegisterRequest): Promise<LoginResponse> {
    const res = await this.request<LoginResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });

    this.setTokens({
      access_token: res.access_token,
      refresh_token: res.refresh_token,
    });

    return res;
  }

  async logout(): Promise<void> {
    try {
      await this.request("/auth/logout", { method: "POST" });
    } finally {
      this.clearTokens();
    }
  }

  async getProjects(user_id: string): Promise<Project[]> {
    const response = await this.request<any[]>(
      `/doc/projects?user_id=${user_id}`,
    );

    return response.map((p) => {
      // Correct way to get FIRST MLS IMAGE
      const firstMlsImage = p.files?.mls?.images?.[0]?.url || undefined;

      return {
        property_id: p.property_id,
        user_id: p.user_id,
        created_at: p.created_at,
        total_images: p.files?.mls?.total_images || 0,
        thumbnail_url: firstMlsImage,
        pdf_urls: p.pdf_urls || [],
        files: p.files,
      };
    });
  }

  async getPropertyDetails(
    propertyId: string,
    userId: string,
  ): Promise<PropertyDetails> {
    const query = `?property_id=${propertyId}&user_id=${userId}`;

    return this.request<PropertyDetails>(`/doc/property${query}`);
  }

  async uploadPDF(
    files: File[],
    propertyId: string,
    fileType: "mls" | "comps" = "mls",
  ): Promise<{ success: boolean; message: string; property_id: string }> {
    // Always get fresh token from localStorage
    this.accessToken = localStorage.getItem("access_token");

    const formData = new FormData();
    // Always send property_id (generate UUID if new)
    const actualPropertyId =
      propertyId === "new" ? crypto.randomUUID() : propertyId;
    formData.append("property_id", actualPropertyId);

    const fieldName = fileType === "mls" ? "mls_files" : "comps_files";

    files.forEach((file) => formData.append(fieldName, file));

    const response = await fetch(`${API_BASE_URL}/doc/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        // Content-Type not set for FormData
      },
      credentials: "omit",
      body: formData,
    });

    if (!response.ok) {
      let message = "Upload failed";

      try {
        const error = await response.json();
        message = error.message || message;
      } catch {}

      console.error(`[UPLOAD ERROR]`, message);
      throw new Error(message);
    }

    const json = await response.json();
    const unwrapped = this.unwrapResponse<any>(json);

    return {
      success: true,
      message: unwrapped.message || "Upload successful",
      property_id: unwrapped.property_id,
    };
  }

  // Alias for backward compatibility if needed, but updated signature is better
  async uploadDocument(
    propertyId: string,
    files: File[],
    notes?: string,
    fileType: "mls" | "comps" = "mls",
  ): Promise<{ success: boolean; message: string; property_id: string }> {
    return this.uploadPDF(files, propertyId, fileType);
  }

  async updateImageCategory(
    property_id: string,
    image_id: string,
    category: string,
    user_id: string,
  ): Promise<any> {
    return this.request(`/doc/image/category`, {
      method: "PUT",
      body: JSON.stringify({ category, property_id, image_id, user_id }),
    });
  }

  async deleteImage(
    property_id: string,
    image_id: string,
    user_id: string,
  ): Promise<any> {
    return this.request(`/chat/delete/images`, {
      method: "DELETE",
      body: JSON.stringify({ property_id, image_id: [image_id], user_id }),
    });
  }

  async regenerateDesign(
    data: ChatRegenerateRequest,
  ): Promise<ChatRegenerateResponse> {
    return this.request<ChatRegenerateResponse>("/chat/regenerate", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async renameCategory(
    property_id: string,
    old_category: string,
    new_category: string,
    user_id: string,
  ): Promise<any> {
    return this.request(`/chat/rename/category`, {
      method: "POST",
      body: JSON.stringify({
        property_id,
        old_category,
        new_category,
        user_id,
      }),
    });
  }

  async deleteCategory(
    property_id: string,
    user_id: string,
    category: string,
    isDeleteCategory: boolean,
  ): Promise<any> {
    return this.request(`/chat/delete/category`, {
      method: "DELETE",
      body: JSON.stringify({
        property_id,
        user_id,
        category,
        isDeleteCategory,
      }),
    });
  }

  async getImageUrl(
    property_id: string,
    user_id: string,
    file: File,
  ): Promise<{ url: string }> {
    this.accessToken = localStorage.getItem("access_token");

    const formData = new FormData();
    formData.append("property_id", property_id);
    if (user_id) formData.append("user_id", user_id);
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/chat/image/url`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "ngrok-skip-browser-warning": "true",
      },
      credentials: "omit",
      body: formData,
    });

    if (!response.ok) {
      let message = "Image upload failed";
      try {
        const err = await response.json();
        message = err.message || message;
      } catch {}
      throw new Error(message);
    }

    const json = await response.json();
    return this.unwrapResponse<{ url: string }>(json);
  }

  async storeIterationImages(body: {
    property_id: string;
    user_id: string;
    images: string;
  }): Promise<any> {
    return this.request(`/chat/store/iteration`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async storeFinalImages(body: {
    property_id: string;
    user_id: string;
    images: {
      url: string;
      description: string;
      category: string;
    }[];
  }): Promise<any> {
    return this.request(`/chat/store/finalproperty`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async addCategory(formData: FormData): Promise<any> {
    // Always get fresh token
    this.accessToken = localStorage.getItem("access_token");

    const response = await fetch(`${API_BASE_URL}/doc/add/category`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "ngrok-skip-browser-warning": "true",
      },
      credentials: "omit",
      body: formData,
    });

    if (!response.ok) {
      let message = "Failed to add category";

      try {
        const error = await response.json();
        message = error.message || message;
      } catch {}

      throw new Error(message);
    }

    const json = await response.json();
    return this.unwrapResponse<any>(json);
  }

  async getFinalImages(
    property_id: string,
    user_id: string,
  ): Promise<{
    images: { url: string; category: string; description?: string }[];
  }> {
    return this.request(
      `/chat/finalproperty?property_id=${property_id}&user_id=${user_id}`,
      {
        method: "GET",
      },
    );
  }

  async deleteIterationImages(
    property_id: string,
    image_ids: string[],
    user_id?: string,
  ): Promise<null> {
    return this.request<null>(`/chat/delete/iteration`, {
      method: "DELETE",
      body: JSON.stringify({
        property_id,
        image_id: image_ids,
        user_id,
      }),
    });
  }

  async deleteProperty(
    property_id: string,
    user_id: string,
  ): Promise<{
    message: string;
    property_id: string;
    property_data_deleted: boolean;
    chat_history_deleted: boolean;
  }> {
    return this.request(
      `/doc/property/delete?property_id=${property_id}&user_id=${user_id}`,
      {
        method: "DELETE",
      },
    );
  }
}


export const api = new ApiClient();
