import { PuffcoProfile } from "./puffco";

export interface APIResponse<T> {
  data: T;
  error?: {
    code: string;
    message?: string;
    issues?: any;
  },
  success: boolean;
}

export interface APIGroup {
  group_id: string;
  sesh_counter: number;
  member_count: number;
  sesher_count: number;
  watcher_count: number;
  name: string;
  visibility: string;
  state: string;
}

export interface DeviceInformation {
  id: string;
  dob: number;
  name: string;
  uid: string;
  totalDabs: number;
  owner: string;
  model: string;
  firmware: string;
  hash: string;
}

export interface DiagService {
  uuid: string;
  characteristicCount: number;
}

export interface DiagParameters {
  uid?: string;
  dob?: number;
  name: string;
  model: string;
  firmware: string;
  hash?: string;
  uptime?: number;
  utc?: number;
  batteryCapacity?: number
  chamberType?: number;
  authenticated?: boolean;
  pupService?: boolean;
  loraxService?: boolean;
}

export interface DiagData {
  session_id: string;
  device_profiles?: Record<number, PuffcoProfile>;
  device_services?: DiagService[];
  device_parameters?: DiagParameters;
}

export interface DeviceLeaderboard {
  device_dob: string;
  device_id: string;
  device_name: string;
  device_model: string;
  id: string;
  owner_name: string;
  total_dabs: number;
  last_active: string;
}
