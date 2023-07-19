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

  dismissedBadges: string[];
}

const initialState: UIState = {
  modal: null,

  dismissedBadges: [],

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
    dismissBadge(state, action: PayloadAction<string>) {
      state.dismissedBadges.push(action.payload);
    },
  },

  extraReducers(builder) {
    builder.addCase<typeof HYDRATE, PayloadAction<AppState, typeof HYDRATE>>(
      HYDRATE,
      (state, { payload }) => ({ ...state, ...payload.ui })
    );
  },
});

export const {
  setCurrentModal,
  setProfileModalOpen,
  setEditingProfile,
  setEditingProfileIndex,
  dismissBadge,
} = ui.actions;

export const selectUIState = (state: AppState) => state.ui;

export default ui.reducer;
