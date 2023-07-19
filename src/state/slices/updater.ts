import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { HYDRATE } from "next-redux-wrapper";

import { AppState } from "../store";

export interface UpdaterState {
  progress: number;
}

const initialState: UpdaterState = {
  progress: 0,
};

export const updater = createSlice({
  name: "updater",
  initialState,
  reducers: {
    setProgress(state, action: PayloadAction<number>) {
      state.progress = action.payload;
    },
  },

  extraReducers(builder) {
    builder.addCase<typeof HYDRATE, PayloadAction<AppState, typeof HYDRATE>>(
      HYDRATE,
      (state, { payload }) => ({ ...state, ...payload.updater })
    );
  },
});

export const { setProgress } = updater.actions;

export const selectUpdaterState = (state: AppState) => state.updater;

export default updater.reducer;
