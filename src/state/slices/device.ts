import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { HYDRATE } from "next-redux-wrapper";

import { AppState } from "../store";
import { AuditLog } from "@puff-social/commons/dist/puffco";

export interface CurrentDeviceState {
  auditLogs: AuditLog[] | null;
  utcTime: number | null;
}

const initialState: CurrentDeviceState = {
  auditLogs: [],
  utcTime: null,
};

export const device = createSlice({
  name: "device",
  initialState,
  reducers: {
    appendAuditLog(state, action: PayloadAction<AuditLog>) {
      if (state.auditLogs.find((itm) => action.payload.id == itm.id)) return;
      state.auditLogs.push(action.payload);
    },
    setDeviceUTCTime(state, action: PayloadAction<number>) {
      state.utcTime = action.payload;
    },
  },

  extraReducers(builder) {
    builder.addCase<typeof HYDRATE, PayloadAction<AppState, typeof HYDRATE>>(
      HYDRATE,
      (state, { payload }) => ({ ...state, ...payload.device })
    );
  },
});

export const { appendAuditLog, setDeviceUTCTime } = device.actions;

export const selectCurrentDeviceState = (state: AppState) => state.device;

export default device.reducer;
