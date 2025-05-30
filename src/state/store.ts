import {
  configureStore,
  ThunkAction,
  Action,
  EnhancedStore,
} from "@reduxjs/toolkit";
import { useDispatch } from "react-redux";
import { createWrapper } from "next-redux-wrapper";
import {
  nextReduxCookieMiddleware,
  wrapMakeStore,
} from "next-redux-cookie-wrapper";

import { session } from "./slices/session";
import { group } from "./slices/group";
import { ui } from "./slices/ui";
import { updater } from "./slices/updater";
import { debugging } from "./slices/debugging";
import { desktop } from "./slices/desktop";
import { device } from "./slices/device";

export let store: EnhancedStore;

const makeStore = wrapMakeStore(() => {
  const configuredStore = configureStore({
    reducer: {
      [session.name]: session.reducer,
      [group.name]: group.reducer,
      [updater.name]: updater.reducer,
      [debugging.name]: debugging.reducer,
      [ui.name]: ui.reducer,
      [desktop.name]: desktop.reducer,
      [device.name]: device.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(
        nextReduxCookieMiddleware({
          maxAge: 2147483647,
          subtrees: [
            {
              subtree: `${ui.name}.dismissedBadges`,
            },
          ],
        })
      ),
    devTools: true,
  });
  store = configuredStore;
  return configuredStore;
});

export type AppStore = ReturnType<typeof makeStore>;
export type AppState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  AppState,
  unknown,
  Action
>;

export const wrapper = createWrapper<AppStore>(makeStore, { debug: true });
export const useAppDispatch = () => useDispatch<AppDispatch>();

if (typeof window != "undefined") {
  window["wrapper"] = wrapper;
}
