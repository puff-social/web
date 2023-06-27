import { useRouter } from "next/router";
import { Transition } from "@headlessui/react";
import PlausibleProvider from "next-plausible";
import { useDispatch, useSelector } from "react-redux";
import { useCallback, useEffect, useMemo } from "react";
import { Toaster, ToastIcon, toast, resolveValue } from "react-hot-toast";

import "tippy.js/dist/tippy.css";
import "../assets/app.css";

import { APIGroup } from "../types/api";
import { wrapper } from "../state/store";
import { gateway } from "../utils/gateway";
import { getCurrentUser } from "../utils/hash";
import { GatewayError, GatewayGroupCreate } from "../types/gateway";
import { selectSessionState, setSessionState } from "../state/slices/session";
import { SuspendedModal } from "../components/modals/Suspended";
import { UserFlags } from "@puff-social/commons";
import { isElectron } from "../utils/electron";
import { Electron } from "../components/Electron";

function App({ Component, pageProps }) {
  const router = useRouter();
  const dispatch = useDispatch();

  const session = useSelector(selectSessionState);

  const headless = useMemo(() => {
    return router.query.headless == "true";
  }, [router]);

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

    if (!headless) router.push("/");
    else router.reload();
  }, []);

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

  return (
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

      {isElectron() ? <Electron /> : <></>}
      {session?.suspended ? <SuspendedModal /> : <></>}

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
      <Component {...pageProps} />
    </PlausibleProvider>
  );
}

export default wrapper.withRedux(App);
