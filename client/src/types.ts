export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user_id: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Project {
  files?: {
    mls: {
      address: string;
      categories?: { unknown?: { images?: { url?: string }[] } };
    };
  };
  property_id: string;
  user_id?: string;
  created_at?: string;
  total_images?: number;
  thumbnail_url?: string;
  pdf_urls?: string[];
  project_address?: string;
  days_left?: number;
  roi_percent?: number;
  drafts_ready?: number;
  city?: string;
  state?: string;
  status?: string;
}

export interface PropertyImage {
  id: string;
  filename: string;
  page: number;
  caption: string;
  mime_type: string;
  file_type?: string;
  category?: string;
  url?: string; // Optional if available directly
  images: {
    category: string;
    filename: string;
    id: string;
    mime_type: string;
    page: number;
    url: string;
  }[];
  categories?: any[];
  addresses: any[];
}

export interface PropertyDetails {
  property_id: string;
  user_id: string;
  // Backend returns separate lists
  files: { mls_images: PropertyImage; comps_images: PropertyImage };
  pdf_urls: string[];
  created_at: string;
  chat_history: any[];
  images: any[];
  iteration_history: any[];
}

export interface Room {
  id: string;
  name: string;
  type: string;
  image_count: number;
}

export interface Iteration {
  id: string;
  version: string;
  label: string;
  image_url: string;
  created_at: string;
  prompt?: string;
}

export interface ChatRegenerateRequest {
  property_id: string;
  images: Record<string, string>;
  user_feedback: string;
}

export interface ChatRegenerateResponse {
  regenerated_images: Array<{ url: string; mime_type: string }>;
  description: string;
  input_count: number;
  message: string;
}

export interface AppNavbarProps {
  centerContent?: React.ReactNode;
  showNewProject?: boolean;
  showBack?: boolean;
  onBack?: () => void;
  propertyId?: string;
  bgcolor?: string;
}

export interface ConfirmModalProps {
  open: boolean;
  title?: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  setUserId: (id: string | null) => void;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

export type FormValues = {
  fullName?: string;
  email: string;
  password: string;
  confirmPassword?: string;
};

export interface Photo {
  id: string;
  src: string;
  rawCategory: string;
  roomCategory: string;
  selected: boolean;
  filename: string;
}

export type DeleteTarget =
  | { type: "image"; photo: Photo }
  | { type: "category"; category: string }
  | null;

export type ChatMessage = {
  sender: "user" | "ai";
  text: string;
  images?: { url: string }[];
};

export interface RenameCategoryModalProps {
  open: boolean;
  initialValue: string;
  loading?: boolean;
  onConfirm: (newName: string) => void;
  onCancel: () => void;
}

export interface AddCategoryModalProps {
  open: boolean;
  onClose: () => void;
  propertyId: string;
  userId: string;
  onSuccess?: () => void;
}

export interface CategoryFormValues {
  categoryName: string;
}

export interface IterationItem {
  id: string;
  v: string;
  url: string;
  description: string;
  category: string;
};