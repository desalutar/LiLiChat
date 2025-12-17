export interface Message {
  id?: number;
  sender_id: number;
  receiver_id: number;
  text: string;
  created_at?: string;
}

export interface User {
  id: number;
  username: string;
}

export interface WebSocketMessage {
  type: "connected" | "message" | "error";
  user_id?: number;
  id?: number;
  sender_id?: number;
  receiver_id?: number;
  text?: string;
  created_at?: number;
  error?: string;
}

export interface SendMessageRequest {
  receiver_id: number;
  text: string;
}

