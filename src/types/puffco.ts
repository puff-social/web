export interface PuffcoProfile {
  name: string;
  temp: number;
  time: string;
}

export interface LoraxMessage {
  seq: number;
  op: number;
  path?: string;
  request: ArrayBufferLike;
  response?: {
    data?: Buffer;
    error?: boolean;
  };
}

export interface LoraxLimits {
  maxPayload: number;
  maxFiles: number;
  maxCommands: number;
}
