import { DeviceModel } from "../utils/puffco";

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
  member_count: number;
  sesher_count: number;
  watcher_count: number;
  name: string;
  visibility: string;
  state: string;
}

export interface DeviceInformation {
  id: string;
  name: string;
  uid: string;
  totalDabs: number;
  owner: string;
  model: DeviceModel;
}

export interface DiagData {
  device_firmware: number;
  device_model: number;
  device_name: string;
}

export interface DeviceLeaderboard {
  device_dob: string;
  device_id: string;
  device_name: string;
  device_model: DeviceModel;
  id: string;
  owner_name: string;
  total_dabs: number;
  last_active: string;
}
