export type RemoteScanStatus =
  | "waiting"
  | "connected"
  | "scanned"
  | "expired"
  | "closed";

export interface RemoteScanSession {
  id: string;
  user_id: string;
  session_token: string;
  status: RemoteScanStatus;
  scanned_value: string | null;
  device_connected: boolean;
  device_info: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface RemoteScanVerifyResult {
  success: boolean;
  session_id?: string;
  status?: RemoteScanStatus;
  device_connected?: boolean;
  expires_at?: string;
  error?: string;
}

export interface RemoteScanSubmitResult {
  success: boolean;
  scanned_value?: string;
  status?: RemoteScanStatus;
  error?: string;
}

export interface RemoteScanBroadcastPayload {
  type: "status-change" | "barcode-detected" | "session-closed";
  sessionId: string;
  status?: RemoteScanStatus;
  barcode?: string;
  timestamp: number;
}
