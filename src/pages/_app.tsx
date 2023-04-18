import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { Transition } from "@headlessui/react";
import { Toaster, ToastIcon, toast, resolveValue } from "react-hot-toast";

import "tippy.js/dist/tippy.css";
import "../assets/app.css";

import { gateway } from "../utils/gateway";
import { APIGroup, User } from "../types/api";
import PlausibleProvider from "next-plausible";
import { getCurrentUser } from "../utils/hash";
import { GatewayError, GatewayGroupCreate } from "../types/gateway";
import { wrapper } from "../state/store";
import { useDispatch } from "react-redux";
import { setSessionState } from "../state/slices/session";

function App({ Component, pageProps }) {
  const router = useRouter();
  const dispatch = useDispatch();

  const headless = useMemo(() => {
    return router.query.headless == "true";
  }, [router]);

  useEffect(() => {
    console.log(router.query, "query");
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

  async function getAndCheckAuth() {
    const auth = localStorage.getItem("puff-social-auth");
    if (auth) {
      const usr = await getCurrentUser();
      dispatch(setSessionState({ user: usr.data.user }));
    }
  }

  useEffect(() => {
    getAndCheckAuth();

    if (typeof localStorage != "undefined")
      localStorage.setItem("puff-social-first-visit", "false");

    gateway.on("group_create", groupCreated);
    gateway.on("internal_error", internalError);
    gateway.on("group_create_error", groupCreateError);
    gateway.on("user_update_error", userUpdateError);
    return () => {
      gateway.removeListener("group_create", groupCreated);
      gateway.removeListener("internal_error", internalError);
      gateway.removeListener("group_create_error", groupCreateError);
      gateway.removeListener("user_update_error", userUpdateError);
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

      {!headless ? (
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
      ) : (
        <></>
      )}
      <Component {...pageProps} />
    </PlausibleProvider>
  );
}

export default wrapper.withRedux(App);
