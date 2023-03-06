import { useRouter } from "next/router";
import { useEffect } from "react";
import { Transition } from "@headlessui/react";
import { Toaster, ToastIcon, toast, resolveValue } from "react-hot-toast";

import "../assets/app.css";
import { gateway } from "../utils/gateway";

import { APIGroup } from "../types/api";
import { GatewayError, GatewayGroupCreate } from "../types/gateway";
import PlausibleProvider from "next-plausible";

export default function App({ Component, pageProps }) {
  const router = useRouter();

  function groupCreated(group: GatewayGroupCreate) {
    toast(`Group ${group.name} (${group.group_id}) created`, {
      position: "bottom-right",
    });
    connectGroup(group);
  }

  function groupCreateError(error: GatewayError) {
    switch (error.code) {
      case "INVALID_GROUP_NAME": {
        toast("Too long or invalid group name (max 32 characters)", {
          position: "bottom-right",
        });
        break;
      }
    }
  }

  function userUpdateError(error: GatewayError) {
    switch (error.code) {
      case "INVALID_NAME": {
        toast("Too long or invalid name (max 32 characters)", {
          position: "bottom-right",
        });
        break;
      }
    }
  }

  useEffect(() => {
    if (typeof localStorage != "undefined")
      localStorage.setItem("puff-social-first-visit", "false");

    gateway.on("group_create", groupCreated);
    gateway.on("group_create_error", groupCreateError);
    gateway.on("user_update_error", userUpdateError);
    return () => {
      gateway.removeListener("group_create", groupCreated);
      gateway.removeListener("user_update_error", userUpdateError);
    };
  }, []);

  async function connectGroup(group: Pick<APIGroup, "name" | "group_id">) {
    router.push(`/group/${group.group_id}`);
  }

  return (
    <PlausibleProvider
      domain="puff.social"
      customDomain="https://analytics.dstn.to"
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
        href="https://fonts.googleapis.com/css2?family=Roboto+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap"
        rel="stylesheet"
      />

      <Toaster>
        {(t) => (
          <Transition
            appear
            show={t.visible}
            className="transform flex justify-center items-center rounded-md p-2 bg-white text-black dark:bg-neutral-800 dark:text-white drop-shadow-xl"
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
      <Component {...pageProps} />
    </PlausibleProvider>
  );
}
