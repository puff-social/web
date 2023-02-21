import { useRouter } from "next/router";
import { useCallback, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

import "../assets/app.css";
import { gateway } from "../utils/gateway";

import { APIGroup } from "../types/api";
import { GatewayError, GatewayGroupCreate } from "../types/gateway";

export default function App({ Component, pageProps }) {
  const router = useRouter();

  function groupCreated(group: GatewayGroupCreate) {
    toast(`Group ${group.name} (${group.group_id}) created`);
    connectGroup(group);
  }

  function groupCreateError(error: GatewayError) {
    switch (error.code) {
      case "INVALID_GROUP_NAME": {
        toast("Too long or invalid group name (max 32 characters)");
        break;
      }
    }
  }

  function userUpdateError(error: GatewayError) {
    switch (error.code) {
      case "INVALID_NAME": {
        toast("Too long or invalid name (max 32 characters)");
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
    <>
      <Toaster />
      <Component {...pageProps} />
    </>
  );
}
