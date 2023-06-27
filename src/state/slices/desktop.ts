import type { BluetoothDevice } from "electron";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { HYDRATE } from "next-redux-wrapper";

import { AppState } from "../store";

export interface DesktopState {
  bluetoothConnectionModalOpen: boolean;
  bluetoothDevices: BluetoothDevice[] | null;
  bluetoothConnecting: boolean;
  selectedBluetoothDevice: BluetoothDevice | null;
}

const initialState: DesktopState = {
  bluetoothConnectionModalOpen: false,
  bluetoothDevices: null,
  bluetoothConnecting: false,
  selectedBluetoothDevice: null,
};

export const desktop = createSlice({
  name: "desktop",
  initialState,
  reducers: {
    setBluetoothDevices(state, action: PayloadAction<BluetoothDevice[]>) {
      state.bluetoothDevices = action.payload;
    },
    setBleConnectionModalOpen(state, action: PayloadAction<boolean>) {
      state.bluetoothConnectionModalOpen = action.payload;
    },
    setBluetoothDevice(state, action: PayloadAction<BluetoothDevice>) {
      state.selectedBluetoothDevice = action.payload;
    },
    setBluetoothConnecting(state, action: PayloadAction<boolean>) {
      state.bluetoothConnecting = action.payload;
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
  setBluetoothDevices,
  setBleConnectionModalOpen,
  setBluetoothConnecting,
  setBluetoothDevice,
} = desktop.actions;

export const selectDesktopState = (state: AppState) => state.desktop;

export default desktop.reducer;
