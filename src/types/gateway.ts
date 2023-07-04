import { VoiceChannelState } from "@puff-social/commons";
import { User } from "./api";
import { DeviceState } from "@puff-social/commons/dist/puffco/constants";

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
  strain: string;
  away: boolean;
  user: User;
  group_joined: string;
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
  ready: string[];
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
  device_state?: DeviceState;
  session_id: string;
  group_joined?: string;
  strain?: string;
  disconnected?: boolean;
  mobile?: boolean;
  away?: boolean;
  user?: User;
  voice?: VoiceChannelState;
}

export interface GroupUserUpdate {
  session_id: string;
  strain?: string;
  name?: string;
}

export interface GroupUserDeviceUpdate {
  device_state: DeviceState;
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
  group_id: string;
  author_session_id: string;
  message: ChatMessageData;
}

export interface GatewayGroupUserAwayState {
  session_id: string;
  state: boolean;
}
