import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { HYDRATE } from "next-redux-wrapper";

import { AppState } from "../store";
import { Connection, User } from "../../types/api";

export interface SessionState {
  user: User | null;
  connection: Connection | null;
  suspended: boolean;
}

const initialState: SessionState = {
  user: null,
  connection: null,
  suspended: false,
};

export const session = createSlice({
  name: "session",
  initialState,
  reducers: {
    updateSessionUser(state, action: PayloadAction<Partial<User>>) {
      for (const key in action.payload) state.user[key] = action.payload[key];
    },
    setSessionState(state, action: PayloadAction<Partial<SessionState>>) {
      if (typeof action.payload.user != "undefined")
        state.user = action.payload.user;
      if (typeof action.payload.connection != "undefined")
        state.connection = action.payload.connection;
      if (typeof action.payload.suspended != "undefined")
        state.suspended = action.payload.suspended;
    },
  },

  extraReducers(builder) {
    builder.addCase<typeof HYDRATE, PayloadAction<AppState, typeof HYDRATE>>(
      HYDRATE,
      (state, { payload }) => ({ ...state, ...payload.session })
    );
  },
});

export const { updateSessionUser, setSessionState } = session.actions;

export const selectSessionState = (state: AppState) => state.session;

export default session.reducer;
