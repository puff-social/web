import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { HYDRATE } from "next-redux-wrapper";

import { Modal } from "../../types/ui";
import { AppState } from "../store";

export interface UIState {
  modal: Modal | null;
}

const initialState: UIState = {
  modal: null,
};

export const ui = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setCurrentModal(state, action: PayloadAction<UIState>) {
      // state.modal = action.payload.modal;
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

export const { setCurrentModal } = ui.actions;

export const selectUIState = (state: AppState) => state;

export default ui.reducer;
