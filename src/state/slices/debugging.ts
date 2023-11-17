import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { HYDRATE } from "next-redux-wrapper";

import { AppState } from "../store";

export interface DebuggingState {
  sessionId: string;
}

const initialState: DebuggingState = {
  sessionId: "",
};

export const debugging = createSlice({
  name: "debugging",
  initialState,
  reducers: {
    setSessionId(state, action: PayloadAction<string>) {
      state.sessionId = action.payload;
    },
  },

  extraReducers(builder) {
    builder.addCase<typeof HYDRATE, PayloadAction<AppState, typeof HYDRATE>>(
      HYDRATE,
      (state, { payload }) => ({ ...state, ...payload.debugging })
    );
  },
});

export const { setSessionId } = debugging.actions;

export const selectDebuggingState = (state: AppState) => state.debugging;

export default debugging.reducer;
