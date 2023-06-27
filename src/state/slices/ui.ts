import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { HYDRATE } from "next-redux-wrapper";

import { Modal } from "../../types/ui";
import { AppState } from "../store";
import { PuffcoProfile } from "../../types/puffco";

export interface UIState {
  modal: Modal | null;

  profileEditModalOpen: boolean;
  editingProfile: PuffcoProfile | null;
  editingProfileIndex: string | null;
}

const initialState: UIState = {
  modal: null,

  profileEditModalOpen: false,
  editingProfile: null,
  editingProfileIndex: null,
};

export const ui = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setCurrentModal(state, action: PayloadAction<UIState>) {
      // state.modal = action.payload.modal;
    },
    setProfileModalOpen(state, action: PayloadAction<boolean>) {
      state.profileEditModalOpen = action.payload;
    },
    setEditingProfile(state, action: PayloadAction<PuffcoProfile>) {
      state.editingProfile = action.payload;
    },
    setEditingProfileIndex(state, action: PayloadAction<string>) {
      state.editingProfileIndex = action.payload;
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

export const {
  setCurrentModal,
  setProfileModalOpen,
  setEditingProfile,
  setEditingProfileIndex,
} = ui.actions;

export const selectUIState = (state: AppState) => state.ui;

export default ui.reducer;
