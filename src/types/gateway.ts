import { ChamberType, ChargeSource } from "../utils/puffco";

export interface Colors {
  r: number;
  g: number;
  b: number;
}

export enum PuffcoOperatingState {
  INIT_MEMORY,
  INIT_VERSION_DISPLAY,
  INIT_BATTERY_DISPLAY,
  MASTER_OFF,
  SLEEP,
  IDLE,
  TEMP_SELECT,
  HEAT_CYCLE_PREHEAT,
  HEAT_CYCLE_ACTIVE,
  HEAT_CYCLE_FADE,
}

export const PuffcoOperatingMap = [
  "Memory",
  "Version",
  "Battery",
  "Off",
  "Sleep",
  "Idle",
  "Temp Sel",
  "Heating",
  "Seshin",
  "Fade",
  "Idle", // Battery
  "Idle", // Version
];

export interface PuffcoState {
  temperature: number;
  battery: number;
  totalDabs: number;
  charging: "USB" | "None" | "Wireless";
  profileColor: Colors;
  activeColor: Colors;
  state: PuffcoOperatingState;
  chargeSource: ChargeSource;
  deviceName: string;
  profile: GatewayDeviceProfile;
  chamberType: ChamberType;
  deviceModel: string;
}

export interface GatewayGroupCreate {
  group_id: string;
  name: string;
}

export interface GatewayError {
  code: string;
}

export interface GroupUserJoin {
  group_id: string;
  session_id: string;
  name: string;
  away: boolean;
}

export interface GroupUserLeft {
  group_id: string;
  session_id: string;
}

export enum GroupState {
  Chilling = "chilling",
  Awaiting = "awaiting",
  Seshing = "seshing",
}

export interface GatewayGroup {
  group_id: string;
  members: GatewayGroupMember[];
  name: string;
  state: GroupState;
  visibility: string;
  owner_session_id: string;
  sesh_counter: number;
}

export interface GatewayGroupAction {
  group_id: string;
}

export interface GatewayGroupMember {
  device_state?: GatewayMemberDeviceState;
  name: string;
  session_id: string;
  away?: boolean;
}

export interface GatewayDeviceProfile {
  name: string;
  temp: number;
  time: number;
}

export interface GatewayMemberDeviceState {
  deviceUid?: string;
  activeColor: Colors;
  battery: number;
  state: number;
  temperature: number;
  totalDabs: number;
  chargeSource: ChargeSource;
  deviceName: string;
  profile: GatewayDeviceProfile;
  chamberType: ChamberType;
  deviceModel: string;
}

export interface GroupUserUpdate {
  session_id: string;
  name: string;
}

export interface GroupUserDeviceUpdate {
  device_state: PuffcoState;
  group_id: string;
  session_id: string;
}

export interface GroupUserDeviceDisconnect {
  group_id: string;
  session_id: string;
}

export interface GroupReaction {
  author_session_id: string;
  emoji: string;
}

export interface GroupActionInitiator {
  session_id: string;
}

export interface GroupHeatInquire {
  session_id: string;
  away: boolean;
  watcher: boolean;
  excluded: boolean;
}

export interface GroupHeatBegin {
  away: boolean;
  watcher: boolean;
  excluded: boolean;
}

export interface ChatMessageData {
  content: string;
  timestamp: number;
}

export interface GroupChatMessage {
  group_id: string
  author_session_id: string;
  message: ChatMessageData;
}

export interface GatewayGroupUserAwayState {
  session_id: string;
  state: boolean;
}