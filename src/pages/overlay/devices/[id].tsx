import { GetServerSidePropsContext } from "next/types";
import { useEffect, useState } from "react";
import { GetDeviceEntry } from "../../../types/api";
import { GroupMember } from "../../../components/GroupMember";
import { getLeaderboardDevice } from "../../../utils/hash";

interface Props {
  id: string;
  initDevice: GetDeviceEntry;
}

export default function DeviceOverlay(props: Props) {
  const [device, setDevice] = useState<GetDeviceEntry>(props.initDevice);

  useEffect(() => {
    console.log(props.initDevice, device);
  }, []);

  return device ? (
    <>
      <GroupMember
        lbDevice={device}
        lbDeviceMac={Buffer.from(props.id.split("_")[1], "base64").toString(
          "utf8"
        )}
        user={device.users}
        headless
      />
    </>
  ) : (
    <></>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id } = context.params;

  const {
    data: { device: lbDevice },
  } = await getLeaderboardDevice(id as string);

  return {
    props: { id: id as string, initDevice: lbDevice },
  };
}
