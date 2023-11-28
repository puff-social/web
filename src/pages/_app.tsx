import { useRouter } from "next/router";
import {
  Op,
  RemoteAction,
  RemoteActionPayload,
  UserFlags,
} from "@puff-social/commons";
import { Transition } from "@headlessui/react";
import PlausibleProvider from "next-plausible";
import Application from "next/app";
import { Provider, useDispatch, useSelector } from "react-redux";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Toaster, ToastIcon, toast, resolveValue } from "react-hot-toast";

import "tippy.js/dist/tippy.css";
import "../assets/app.css";
import "../assets/christmas.css";

import { APIGroup } from "../types/api";
import { wrapper } from "../state/store";
import { gateway } from "../utils/gateway";
import { getCurrentUser } from "../utils/hash";
import { GatewayError, GatewayGroupCreate } from "../types/gateway";
import { selectSessionState, setSessionState } from "../state/slices/session";
import { SuspendedModal } from "../components/modals/Suspended";
import { isElectron } from "../utils/electron";
import { Electron } from "../components/Electron";
import { IntroModal } from "../components/modals/Intro";
import NoSSR from "../components/NoSSR";
import { KevoModal } from "../components/modals/KevoModal";
import { selectGroupState } from "../state/slices/group";
import { instance } from "./[id]";
import { DeviceCommand } from "@puff-social/commons/dist/puffco";

function AppWrapper({ Component, ...appProps }) {
  const { store, props } = wrapper.useWrappedStore(appProps);

  return (
    <Provider store={store}>
      <App Component={Component} store={store} props={props.pageProps} />
    </Provider>
  );
}

function App({ Component, store, props }) {
  const router = useRouter();

  const session = useSelector(selectSessionState);
  const group = useSelector(selectGroupState);
  const dispatch = useDispatch();
  const headless = useMemo(() => {
    return router.query.headless == "true";
  }, [router]);

  const noIntroScreen = useMemo(() => {
    if (["/overlay/devices/[id]", "/debugging"].includes(router.pathname))
      return true;
    return false;
  }, [router]);

  const [firstVisit] = useState(() =>
    typeof localStorage != "undefined"
      ? localStorage.getItem("puff-social-first-visit") != "false"
      : false
  );

  const [callKevo] = useState(() =>
    typeof location != "undefined"
      ? new URL(location.href).searchParams.get("ref") == "callkevo"
      : false
  );

  function groupCreated(group: GatewayGroupCreate) {
    toast(`Group ${group.name} (${group.group_id}) created`, {
      position: "top-right",
    });
    connectGroup(group);
  }

  function groupCreateError(error: GatewayError) {
    switch (error.code) {
      case "INVALID_GROUP_NAME": {
        toast("Too long or invalid group name (max 32 characters)", {
          position: "top-right",
        });
        break;
      }
    }
  }

  function userUpdateError(error: GatewayError) {
    switch (error.code) {
      case "INVALID_NAME": {
        toast("Too long or invalid name (max 32 characters)", {
          position: "top-right",
        });
        break;
      }
    }
  }

  function internalError(error: any) {
    toast("Rosin encountered an internal error, this has been logged", {
      position: "top-right",
    });
  }

  function syntaxError(error: any) {
    console.log(error);
    toast("Syntax error with data sent to Rosin, check console.", {
      position: "top-right",
    });
  }

  async function getAndCheckAuth() {
    const auth = localStorage.getItem("puff-social-auth");
    if (auth) {
      try {
        const usr = await getCurrentUser();
        dispatch(
          setSessionState({
            user: usr.data.user,
            connection: usr.data.connection,
            suspended: usr.data.user.flags & UserFlags.suspended,
          })
        );
      } catch (error) {}
    }
  }

  const sessionResumeFailed = useCallback(async () => {
    toast("Failed to resume socket session", {
      position: "top-right",
      duration: 2000,
      icon: "❌",
    });

    if (!headless && !router.pathname.startsWith("/overlay/devices"))
      router.push("/");
    else router.reload();
  }, []);

  const remoteGatewayAction = useCallback(
    async (data: RemoteActionPayload) => {
      switch (data.action) {
        case RemoteAction.REFRESH: {
          router.reload();
          break;
        }
        case RemoteAction.DISCONNECT: {
          instance.disconnect();
          break;
        }
        case RemoteAction.INQUIRE_DAB: {
          gateway.send(Op.InquireHeating);
          break;
        }
        case RemoteAction.BEGIN_HEAT: {
          instance.sendCommand(DeviceCommand.HEAT_CYCLE_BEGIN);
          break;
        }
        case RemoteAction.CANCEL_HEAT: {
          instance.sendCommand(DeviceCommand.HEAT_CYCLE_STOP);
          break;
        }

        default:
          break;
      }
    },
    [group.group]
  );

  useEffect(() => {
    gateway.on("remote_action", remoteGatewayAction);

    return () => {
      gateway.removeListener("remote_action", remoteGatewayAction);
    };
  }, [remoteGatewayAction]);

  useEffect(() => {
    getAndCheckAuth();

    if (typeof localStorage != "undefined")
      localStorage.setItem("puff-social-first-visit", "false");

    gateway.on("group_create", groupCreated);
    gateway.on("internal_error", internalError);
    gateway.on("syntax_error", syntaxError);
    gateway.on("group_create_error", groupCreateError);
    gateway.on("user_update_error", userUpdateError);
    gateway.on("resume_failed", sessionResumeFailed);

    return () => {
      gateway.removeListener("group_create", groupCreated);
      gateway.removeListener("internal_error", internalError);
      gateway.removeListener("syntax_error", syntaxError);
      gateway.removeListener("group_create_error", groupCreateError);
      gateway.removeListener("user_update_error", userUpdateError);
      gateway.removeListener("resume_failed", sessionResumeFailed);
    };
  }, []);

  async function connectGroup(group: Pick<APIGroup, "name" | "group_id">) {
    router.push(`/${group.group_id}`);
  }

  useEffect(() => {
    if (callKevo) router.replace(router.pathname, undefined, { shallow: true });
  }, [callKevo]);

  return (
    <Provider store={store}>
      <PlausibleProvider
        domain="puff.social"
        enabled={
          typeof window != "undefined" &&
          window.location.hostname == "puff.social"
        }
        selfHosted
      >
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="yes"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&family=Noto+Color+Emoji&family=Coda&display=swap"
          rel="stylesheet"
        />

        <NoSSR>
          {isElectron() ? <Electron /> : <></>}
          {session?.suspended ? <SuspendedModal /> : <></>}
          {callKevo ? <KevoModal /> : <></>}
          {firstVisit && !noIntroScreen ? <IntroModal /> : <></>}
        </NoSSR>

        {!headless ? (
          <>
            <Toaster>
              {(t) => (
                <Transition
                  appear
                  show={t.visible}
                  className="transform flex justify-center items-center rounded-md p-2 bg-white text-black dark:bg-neutral-800 dark:text-white drop-shadow-xl max-w-96"
                  enter="transition-all duration-150"
                  enterFrom="opacity-0 scale-50"
                  enterTo="opacity-100 scale-100"
                  leave="transition-all duration-150"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-75"
                >
                  <ToastIcon toast={t} />
                  <p className="px-2">{resolveValue(t.message, t)}</p>
                </Transition>
              )}
            </Toaster>
          </>
        ) : (
          <></>
        )}
        <Component {...props} />
      </PlausibleProvider>
    </Provider>
  );
}

export async function getInitialProps() {
  wrapper.getInitialAppProps((store) => async (context) => {
    return {
      ...(await Application.getInitialProps(context)).pageProps,
      pathname: context.ctx.pathname,
    };
  });
}

export default AppWrapper;
