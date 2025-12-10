export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  user_id: number;
}

export interface RegisterResponse {
  user_id: number;
  message?: string;
}