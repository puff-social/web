import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { HYDRATE } from "next-redux-wrapper";

import { AppState } from "../store";
import { User } from "../../types/api";

export interface SessionState {
  user: User | null;
}

const initialState: SessionState = {
  user: null,
};

export const session = createSlice({
  name: "session",
  initialState,
  reducers: {
    setSessionState(state, action: PayloadAction<SessionState>) {
      state.user = action.payload.user;
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