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
import { API_URL, getCurrentUser } from "../utils/hash";
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
import { DomainRenewalCTA } from "../components/DomainRenewalCTA";

const LEGACY_DOMAIN = "puff.social";
const TARGET_HOSTNAME = "puff.dstn.to";
const OVERLAY_PATH = "/overlay";

function shouldSkipLegacyRedirect(pathname: string) {
  return pathname === OVERLAY_PATH || pathname.startsWith(`${OVERLAY_PATH}/`);
}

function shouldRedirectLegacyDomain(
  hostname: string | undefined,
  pathname: string,
) {
  const normalizedHost = hostname?.toLowerCase();
  return (
    normalizedHost === LEGACY_DOMAIN && !shouldSkipLegacyRedirect(pathname)
  );
}

function buildLegacyRedirectUrl(currentHref: string) {
  const redirectUrl = new URL(currentHref);
  redirectUrl.hostname = TARGET_HOSTNAME;
  redirectUrl.protocol = "https:";
  redirectUrl.port = "";
  return redirectUrl.toString();
}

function attemptClientLegacyRedirect() {
  if (typeof window === "undefined") return false;

  const { hostname, pathname, href } = window.location;

  if (!shouldRedirectLegacyDomain(hostname, pathname)) {
    return false;
  }

  window.location.replace(buildLegacyRedirectUrl(href));
  return true;
}

if (typeof window !== "undefined") {
  attemptClientLegacyRedirect();
}

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
      : false,
  );

  const [callKevo] = useState(() =>
    typeof location != "undefined"
      ? new URL(location.href).searchParams.get("ref") == "callkevo"
      : false,
  );

  useEffect(() => {
    attemptClientLegacyRedirect();
  }, [router.asPath]);

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
    fetch(`${API_URL}/health`)
      .then(async (data) => {
        if (data.status == 204 && router.pathname == "/maintenance")
          return router.push("/");

        const auth = localStorage.getItem("puff-social-auth");
        if (auth) {
          try {
            const usr = await getCurrentUser();
            dispatch(
              setSessionState({
                user: usr.data.user,
                connection: usr.data.connection,
                suspended: usr.data.user.flags & UserFlags.suspended,
              }),
            );
          } catch (error) {}
        }
      })
      .catch(() => {
        if (router.pathname != "/maintenance") router.push("/maintenance");
      });
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
    [group.group],
  );

  useEffect(() => {
    gateway.on("remote_action", remoteGatewayAction);

    return () => {
      gateway.removeListener("remote_action", remoteGatewayAction);
    };
  }, [remoteGatewayAction]);

  useEffect(() => {
    if (router.pathname == "/maintenance") {
      setInterval(() => {
        getAndCheckAuth();
      }, 5000);
    } else {
      getAndCheckAuth();
    }

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
        domain="puff.dstn.to"
        taggedEvents={true}
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
          crossOrigin="anonymous"
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
                  enter="transition-all duration-150"
                  enterFrom="opacity-0 scale-50"
                  enterTo="opacity-100 scale-100"
                  leave="transition-all duration-150"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-75"
                >
                  <div className="transform flex justify-center items-center rounded-md p-2 bg-white text-black dark:bg-neutral-800 dark:text-white drop-shadow-xl max-w-96">
                    <ToastIcon toast={t} />
                    <p className="px-2">{resolveValue(t.message, t)}</p>
                  </div>
                </Transition>
              )}
            </Toaster>
            {router.pathname.startsWith("/overlay") ? (
              <></>
            ) : (
              <DomainRenewalCTA />
            )}
          </>
        ) : (
          <></>
        )}
        <Component {...props} />
      </PlausibleProvider>
    </Provider>
  );
}

AppWrapper.getInitialProps = wrapper.getInitialAppProps(
  (store) => async (context) => {
    const appProps = await Application.getInitialProps(context);

    const { req, res } = context.ctx;

    const headers = req?.headers ?? {};
    const forwardedHostHeader = Array.isArray(headers["x-forwarded-host"])
      ? headers["x-forwarded-host"][0]
      : headers["x-forwarded-host"];
    const hostHeader =
      forwardedHostHeader ??
      (Array.isArray(headers.host) ? headers.host[0] : headers.host);

    const host = hostHeader?.split(":")[0].toLowerCase();
    const rawPath =
      context.ctx.asPath ??
      (typeof req?.url === "string" ? req.url : undefined) ??
      context.ctx.pathname ??
      "/";

    const normalizedPath = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
    const barePath = normalizedPath.split("?")[0];

    if (
      req &&
      res &&
      !res.headersSent &&
      !res.writableEnded &&
      shouldRedirectLegacyDomain(host, barePath)
    ) {
      const destination = `https://${TARGET_HOSTNAME}${normalizedPath}`;
      res.writeHead(308, { Location: destination });
      res.end();
    }

    return {
      ...appProps,
      pageProps: {
        ...appProps.pageProps,
        pathname: context.ctx.pathname,
      },
    };
  },
);

export default AppWrapper;
