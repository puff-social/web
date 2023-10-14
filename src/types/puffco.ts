import { AuditLogCode, FaultLogCode } from "@puff-social/commons/dist/puffco";

export interface PuffcoProfile {
  name: string;
  temp: number;
  time: string;
  color: string;
  intensity?: number;
}

export interface AuditLogEntry {
  id: number;
  type: AuditLogCode;
  timestamp: Date;
  data: Buffer;
}

export interface FaultLogEntry {
  id: number;
  type: FaultLogCode;
  timestamp: Date;
  data: Buffer;
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
