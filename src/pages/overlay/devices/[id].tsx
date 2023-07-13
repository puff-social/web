import { GetServerSidePropsContext } from "next/types";
import { useCallback, useEffect, useState } from "react";
import { GetDeviceEntry } from "../../../types/api";
import { GroupMember } from "../../../components/GroupMember";
import { getLeaderboardDevice } from "../../../utils/hash";
import { GatewayWatchedDeviceUpdate } from "../../../types/gateway";
import { gateway } from "../../../utils/gateway";
import { Op } from "@puff-social/commons";

interface Props {
  id: string;
  initDevice: GetDeviceEntry;
  removeBackground: boolean;
  useDeviceName: boolean;
}

export default function DeviceOverlay(props: Props) {
  const [device, setDevice] = useState<GetDeviceEntry>(props.initDevice);

  const watchedUpdate = useCallback(
    (data: GatewayWatchedDeviceUpdate) => {
      if (data.id == props.id) {
        setDevice((device) => ({
          ...device,
          ...(data.lastDab
            ? { last_dab: new Date(data.lastDab.timestamp).toISOString() }
            : {}),
          ...(data.dabs ? { dabs: data.dabs } : {}),
          ...(data.dabsPerDay ? { avg_dabs: data.dabsPerDay } : {}),
        }));
      }
    },
    [device]
  );

  async function watchDevice(id: string) {
    if (gateway.ws.readyState == gateway.ws.OPEN) {
      gateway.send(Op.WatchDevice, { id });
    } else {
      new Promise((resolve) => setTimeout(() => resolve(1), 100)).then(() =>
        watchDevice(id)
      );
    }
  }

  useEffect(() => {
    watchDevice(props.id);
  }, []);

  useEffect(() => {
    gateway.addListener("watched_device_update", watchedUpdate);

    return () => {
      gateway.removeListener("watched_device_update", watchedUpdate);
    };
  }, [watchedUpdate]);

  return device ? (
    <>
      <GroupMember
        lbDevice={device}
        lbDeviceMac={Buffer.from(props.id.split("_")[1], "base64").toString(
          "utf8"
        )}
        user={device.users}
        removeBackground={props.removeBackground}
        useDeviceName={props.useDeviceName}
        headless
      />
    </>
  ) : (
    <></>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id } = context.params;
  const { removeBackground, useDeviceName } = context.query;

  const {
    data: { device: lbDevice },
  } = await getLeaderboardDevice(id as string);

  return {
    props: {
      id: id as string,
      initDevice: lbDevice,
      removeBackground: typeof removeBackground != "undefined",
      useDeviceName: typeof useDeviceName != "undefined",
    },
  };
}
