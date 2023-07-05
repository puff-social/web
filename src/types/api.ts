import { PuffcoProfile } from "./puffco";

export interface APIResponse<T> {
  data: T;
  error?: {
    code: string;
    message?: string;
    issues?: any;
  };
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
  mac: string;
  totalDabs: number;
  dabsPerDay: number;
  owner: string;
  model: string;
  firmware: string;
  hardware: number;
  gitHash: string;
  utcTime: number;
  lastDabAt: string;
  batteryPreservation: number;
}

export interface DiagService {
  uuid: string;
  characteristicCount: number;
}

export interface DiagParameters {
  mac?: string;
  dob?: number;
  name: string;
  model: string;
  firmware: string;
  hardwareVersion?: number;
  serialNumber?: string;
  hash?: string;
  uptime?: number;
  utc?: number;
  batteryCapacity?: number;
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

export interface User {
  id: string;
  name: string;
  display_name: string;
  image: string;
  banner: string;
  flags: number;
  bio: string;
  location: string;
}

export interface Connection {
  id: string;
  platform: string;
  platform_id: string;
  user_id: string;
  verified: boolean;
}

export interface LeaderboardEntry {
  id: string;
  position: number;
  devices: {
    name: string;
    dabs: number;
    avg_dabs: number;
    model: string;
    firmware: string;
    hardware: string;
    last_active: string;
    dob: string;
    user_id?: string;
    users?: User;
  };
}
