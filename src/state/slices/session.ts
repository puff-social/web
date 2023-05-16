import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { HYDRATE } from "next-redux-wrapper";

import { AppState } from "../store";
import { Connection, User } from "../../types/api";

export interface SessionState {
  user: User | null;
  connection: Connection | null;
}

const initialState: SessionState = {
  user: null,
  connection: null,
};

export const session = createSlice({
  name: "session",
  initialState,
  reducers: {
    setSessionState(state, action: PayloadAction<Partial<SessionState>>) {
      if (action.payload.user) state.user = action.payload.user;
      if (action.payload.connection)
        state.connection = action.payload.connection;
    },
  },

  extraReducers: {
    [HYDRATE]: (state, action) => {
      return {
        ...state,
        ...action.payload,
      };
    },
  },
});

export const { setSessionState } = session.actions;

export const selectSessionState = (state: AppState) => state.session;

export default session.reducer;
