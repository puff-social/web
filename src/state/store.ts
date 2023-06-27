import {
  configureStore,
  ThunkAction,
  Action,
  EnhancedStore,
} from "@reduxjs/toolkit";
import { createWrapper } from "next-redux-wrapper";

import { session } from "./slices/session";
import { group } from "./slices/group";
import { updater } from "./slices/updater";
import { desktop } from "./slices/desktop";

export let store: EnhancedStore;

const makeStore = () => {
  store = configureStore({
    reducer: {
      [session.name]: session.reducer,
      [group.name]: group.reducer,
      [updater.name]: updater.reducer,
      [desktop.name]: desktop.reducer,
    },
    devTools: true,
  });
  return store;
};

export type AppStore = ReturnType<typeof makeStore>;
export type AppState = ReturnType<AppStore["getState"]>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  AppState,
  unknown,
  Action
>;

export const wrapper = createWrapper<AppStore>(makeStore);

if (typeof window != "undefined") {
  window["wrapper"] = wrapper;
}
