import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { HYDRATE } from "next-redux-wrapper";

import { AppState } from "../store";
import {
  GatewayGroup,
  GroupUserDeviceUpdate,
  GroupUserJoin,
  GroupUserUpdate,
} from "../../types/gateway";
import { DeviceInformation } from "../../types/api";
import { PuffcoProfile } from "../../types/puffco";
import { DeviceState } from "@puff-social/commons/dist/puffco";

export interface GroupState {
  group?: GatewayGroup;

  deviceProfiles?: Record<number, PuffcoProfile>;
  deviceInfo?: DeviceInformation;
  device?: DeviceState;

  joinErrorMessage?: string;
  usAway?: boolean;
  ourStrain?: string;
  connectDismissed?: boolean;
  connected?: boolean;
  usDisconnected?: boolean;
  deviceConnected?: boolean;
  ourLeaderboardPosition?: number;
}

const initialState: Partial<GroupState> = {
  group: undefined,
  device: undefined,
  deviceInfo: undefined,
  deviceProfiles: undefined,
  ourStrain: undefined,
  ourLeaderboardPosition: undefined,
  usAway: false,
  connected: false,
  usDisconnected: false,
  deviceConnected: false,
  connectDismissed: false,
  joinErrorMessage: undefined,
};

export const group = createSlice({
  name: "group",
  initialState,
  reducers: {
    addGroupMember(state, action: PayloadAction<GroupUserJoin>) {
      if (!state.group.members) state.group.members = [];
      state.group.members = [...state.group.members, action.payload];
    },
    removeGroupMember(state, action: PayloadAction<string>) {
      state.group.members = state.group.members.filter(
        (mem) => mem.session_id != action.payload
      );
    },
    updateGroupMember(state, action: PayloadAction<GroupUserUpdate>) {
      const existing = state.group.members.find(
        (mem) => mem.session_id == action.payload.session_id
      );
      delete action.payload.session_id;
      for (const key in action.payload) existing[key] = action.payload[key];
    },
    updateGroupMemberDevice(
      state,
      action: PayloadAction<GroupUserDeviceUpdate>
    ) {
      try {
        const existing = state.group.members.find(
          (mem) => mem.session_id == action.payload.session_id
        );

        if (action.payload.device_state == null) {
          delete existing.device_state;
        } else {
          if (!existing.device_state)
            existing.device_state = action.payload.device_state;

          for (const key of Object.keys(action.payload.device_state))
            existing.device_state[key] = action.payload.device_state[key];
        }
      } catch (error) {}
    },
    updateGroupState(state, action: PayloadAction<GroupState>) {
      for (const key of Object.keys(action.payload))
        state.group[key] = action.payload[key];
    },
    setGroupState(state, action: PayloadAction<GroupState>) {
      for (const key of Object.keys(action.payload))
        state[key] = action.payload[key];
    },
    resetGroupState(state, action: PayloadAction) {
      state = initialState;
    },
  },

  extraReducers(builder) {
    builder.addCase<typeof HYDRATE, PayloadAction<AppState, typeof HYDRATE>>(
      HYDRATE,
      (state, { payload }) => ({ ...state, ...payload.group })
    );
  },
});

export const {
  setGroupState,
  updateGroupState,
  resetGroupState,
  addGroupMember,
  updateGroupMember,
  updateGroupMemberDevice,
  removeGroupMember,
} = group.actions;

export const selectGroupState = (state: AppState) => state.group;

export default group.reducer;
