export interface PuffcoProfile {
  name: string;
  temp: number;
  time: string;
  intensity?: number;
}

export interface LoraxMessage {
  seq: number;
  op: number;
  path?: string;
  characteristic?: string;
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
