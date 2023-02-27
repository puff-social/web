import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import { useCallback, useEffect, useState } from "react";
import { Tippy } from "../../components/Tippy";

import {
  GatewayError,
  GatewayGroup,
  GatewayGroupMember,
  GatewayMemberDeviceState,
  GroupActionInitiator,
  GroupState,
  GroupUserDeviceUpdate,
  GroupUserJoin,
  GroupUserLeft,
  PuffcoOperatingState,
} from "../../types/gateway";
import {
  DeviceCommand,
  disconnectBluetooth,
  PuffLightMode,
  sendCommand,
  setLightMode,
  startConnection,
  startPolling,
} from "../../utils/puffco";
import { gateway, Op } from "../../utils/gateway";
import { UserSettingsModal } from "../../components/modals/UserSettings";
import { InfoModal } from "../../components/modals/Info";
import { Settings } from "../../components/icons/Settings";
import { Info } from "../../components/icons/Info";
import { trackDevice } from "../../utils/analytics";
import { GroupMeta } from "../../components/GroupMeta";
import { NextPageContext } from "next";
import { getGroupById } from "../../utils/api";
import { APIGroup } from "../../types/api";
import { GroupMember } from "../../components/GroupMember";

export default function Group({ group: initGroup }: { group: APIGroup }) {
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [groupConnected, setGroupConnected] = useState(false);
  const [group, setGroup] = useState<GatewayGroup>();
  const [groupJoinErrorMessage, setGroupJoinErrorMessage] = useState<string>();
  const [groupMembers, setGroupMembers] = useState<GatewayGroupMember[]>([]);

  const [ourName, setOurName] = useState(() =>
    typeof localStorage != "undefined"
      ? localStorage.getItem("puff-social-name") || "Unnamed"
      : "Unnamed"
  );

  const [readyMembers, setReadyMembers] = useState<string[]>([]);

  const [myDevice, setMyDevice] = useState<GatewayMemberDeviceState>();

  const [userSettingsModalOpen, setUserSettingsModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(() =>
    typeof localStorage != "undefined"
      ? !(localStorage.getItem("puff-social-first-visit") == "false")
      : false
  );

  const router = useRouter();
  const { id } = router.query;

  function validState(state: GatewayMemberDeviceState) {
    if (!state) return false;
    const required = [
      "temperature",
      "battery",
      "totalDabs",
      "state",
      "deviceModel",
    ];
    for (const key of required) {
      if (typeof state[key] == "undefined") return false;
    }
    return true;
  }

  function joinedGroup(group: GatewayGroup) {
    setGroupJoinErrorMessage("");
    setGroupConnected(true);
    setGroup(group);
    setGroupMembers(group.members);
  }

  const updatedGroup = useCallback(
    (newGroup: GatewayGroup) => {
      if (
        group.state == GroupState.Seshing &&
        newGroup.state == GroupState.Chilling
      )
        setReadyMembers([]);
      setGroup(newGroup);

      if (newGroup.state == GroupState.Awaiting && deviceConnected)
        setLightMode(PuffLightMode.QueryReady);
      else if (
        newGroup.state == GroupState.Chilling &&
        deviceConnected &&
        validState(myDevice as unknown as GatewayMemberDeviceState)
      )
        setLightMode(PuffLightMode.Default);
    },
    [readyMembers, group, deviceConnected, myDevice]
  );

  function groupMemberUpdated(member: GatewayGroupMember) {
    if (
      member.session_id == gateway.session_id &&
      typeof member.name != "undefined"
    )
      setOurName(member.name);

    setGroupMembers((curr) => {
      const existing = curr.find((mem) => mem.session_id == member.session_id);
      if (!existing) return curr;
      for (const key in member) existing[key] = member[key];
      return [...curr];
    });
  }

  function groupMemberDeviceUpdated({
    device_state,
    session_id,
  }: GroupUserDeviceUpdate) {
    if (!device_state) return;
    setGroupMembers((curr) => {
      const existing = curr.find((mem) => mem.session_id == session_id);
      if (typeof existing.device_state == "undefined")
        existing.device_state = device_state;
      if (!existing || typeof existing.device_state != "object") return curr;
      for (const key in device_state)
        existing.device_state[key] = device_state[key];
      return [...curr];
    });
  }

  function groupMemberDeviceDisconnected({
    session_id,
  }: GroupUserDeviceUpdate) {
    setGroupMembers((curr) => {
      const existing = curr.find((mem) => mem.session_id == session_id);
      if (!existing || typeof existing.device_state != "object") return curr;
      for (const key in existing.device_state)
        delete existing.device_state[key];
      return [...curr];
    });
  }

  function groupMemberJoin({ session_id, name, device_type }: GroupUserJoin) {
    toast(`${name} joined`);
    setGroupMembers((curr) => [...curr, { session_id, name, device_type }]);
  }

  function groupMemberLeft({ session_id }: GroupUserLeft) {
    setGroupMembers((curr) => {
      const member = curr.find((mem) => mem.session_id == session_id);
      if (member) toast(`${member.name} left`);
      return [...curr.filter((mem) => mem.session_id != session_id)];
    });
  }

  async function startDab() {
    toast("3...", { duration: 1000 });
    setTimeout(() => {
      toast("2...", { duration: 1000 });
      setTimeout(() => {
        toast("1...", { duration: 900 });
        toast("Dab", { duration: 1000 });
        sendCommand(DeviceCommand.HEAT_CYCLE_BEGIN);
      }, 1000);
    }, 1000);
  }

  async function startWithReady() {
    gateway.send(Op.StartWithReady);
  }

  async function sendStartDab() {
    gateway.send(Op.InquireHeating);
  }

  async function stopSesh() {
    gateway.send(Op.StopAwaiting);
  }

  const inquireDab = useCallback(
    (data: GroupActionInitiator) => {
      setGroupMembers((groupMembers) => {
        const initiator = groupMembers.find(
          (mem) => mem.session_id == data.session_id
        );

        toast(
          `${
            data.session_id == gateway.session_id ? ourName : initiator.name
          } wants to start`,
          { icon: "🔥", duration: 5000 }
        );
        toast(`Confirm by pressing your button`, {
          icon: "🔘",
          duration: 8000,
        });
        return groupMembers;
      });
    },
    [groupMembers]
  );

  const groupMemberReady = useCallback(
    (data: GroupActionInitiator) => {
      setGroupMembers((groupMembers) => {
        const initiator = groupMembers.find(
          (mem) => mem.session_id == data.session_id
        );

        setReadyMembers((curr) =>
          curr.includes(data.session_id) ? curr : [...curr, data.session_id]
        );

        toast(
          `${
            data.session_id == gateway.session_id ? ourName : initiator.name
          } is ready`,
          { icon: "✅", duration: 5000 }
        );
        return groupMembers;
      });
    },
    [groupMembers]
  );

  const groupMemberUnready = useCallback(
    (data: GroupActionInitiator) => {
      setGroupMembers((groupMembers) => {
        const initiator = groupMembers.find(
          (mem) => mem.session_id == data.session_id
        );

        setReadyMembers((curr) => [
          ...curr.filter((item) => item != data.session_id),
        ]);

        toast(
          `${
            data.session_id == gateway.session_id ? ourName : initiator.name
          } is no longer ready`,
          { icon: "🚫", duration: 5000 }
        );
        return groupMembers;
      });
    },
    [groupMembers]
  );

  function groupJoinError(error: GatewayError) {
    switch (error.code) {
      case "INVALID_GROUP_ID": {
        setGroupJoinErrorMessage("Unknown or invalid group ID");
        break;
      }
    }
  }

  const groupChangeVisibility = useCallback(
    (data: GroupActionInitiator & { visibility: string }) => {
      setGroupMembers((groupMembers) => {
        const initiator = groupMembers.find(
          (mem) => mem.session_id == data.session_id
        );

        toast(
          `${
            data.session_id == gateway.session_id ? ourName : initiator.name
          } made the group ${data.visibility}`,
          { icon: data.visibility == "public" ? "🌍" : "🔒", duration: 5000 }
        );
        return groupMembers;
      });
    },
    [groupMembers]
  );

  const disconnect = useCallback(async () => {
    if (deviceConnected) await setLightMode(PuffLightMode.Default);
    disconnectBluetooth();
    setDeviceConnected(false);
    gateway.send(Op.DisconnectDevice);
  }, [deviceConnected]);

  useEffect(() => {
    if (initGroup && initGroup.group_id) {
      gateway.on("joined_group", joinedGroup);
      gateway.on("group_join_error", groupJoinError);
      gateway.on("group_user_update", groupMemberUpdated);
      gateway.on("group_user_device_update", groupMemberDeviceUpdated);
      gateway.on("group_user_device_disconnect", groupMemberDeviceDisconnected);
      gateway.on("group_heat_begin", startDab);
      gateway.on("group_heat_inquiry", inquireDab);
      gateway.on("group_visibility_change", groupChangeVisibility);

      gateway.on("group_user_ready", groupMemberReady);
      gateway.on("group_user_unready", groupMemberUnready);
      gateway.on("group_user_join", groupMemberJoin);
      gateway.on("group_user_left", groupMemberLeft);
      if (gateway.ws.readyState == gateway.ws.OPEN)
        gateway.send(Op.Join, { group_id: id });
      else gateway.once("init", () => gateway.send(Op.Join, { group_id: id }));
      return () => {
        gateway.send(Op.LeaveGroup);
        disconnectBluetooth();
        setDeviceConnected(false);
        gateway.removeListener("joined_group", joinedGroup);
        gateway.removeListener("group_join_error", groupJoinError);

        gateway.removeListener("group_user_update", groupMemberUpdated);
        gateway.removeListener(
          "group_user_device_update",
          groupMemberDeviceUpdated
        );
        gateway.removeListener(
          "group_user_device_disconnect",
          groupMemberDeviceDisconnected
        );
        gateway.removeListener("group_heat_inquiry", inquireDab);
        gateway.removeListener(
          "group_visibility_change",
          groupChangeVisibility
        );
        gateway.removeListener("group_heat_begin", startDab);
        gateway.removeListener("group_user_ready", groupMemberReady);
        gateway.removeListener("group_user_unready", groupMemberUnready);
        gateway.removeListener("group_user_join", groupMemberJoin);
        gateway.removeListener("group_user_left", groupMemberLeft);
      };
    }
  }, [initGroup]);

  useEffect(() => {
    gateway.on("group_update", updatedGroup);
    return () => {
      gateway.removeListener("group_update", updatedGroup);
    };
  }, [updatedGroup]);

  const connectToDevice = useCallback(async () => {
    try {
      const device = await startConnection();
      toast(`Connected to ${device.name}`, { icon: "✅" });
      const { poller, initState, deviceInfo } = await startPolling();
      await trackDevice(deviceInfo, ourName);
      gateway.send(Op.SendDeviceState, initState);
      setDeviceConnected(true);
      setMyDevice((curr) => ({ ...curr, ...initState }));
      poller.on("data", async (data) => {
        if (data.totalDabs)
          trackDevice({ ...deviceInfo, totalDabs: data.totalDabs }, ourName);
        setGroup((currGroup) => {
          if (
            currGroup.state == GroupState.Awaiting &&
            data.state == PuffcoOperatingState.TEMP_SELECT
          ) {
            setLightMode(PuffLightMode.MarkedReady);
          }

          return currGroup;
        });
        setMyDevice((curr) => {
          return { ...curr, ...data };
        });
        gateway.send(Op.SendDeviceState, data);
      });
      device.ongattserverdisconnected = async () => {
        if (deviceConnected) await setLightMode(PuffLightMode.Default);
        poller.emit("stop");
        setDeviceConnected(false);
        gateway.send(Op.DisconnectDevice);
        toast(`Disconnected from ${device.name}`, { icon: "🚫" });
      };
    } catch (error) {
      console.error(error);
    }
  }, [ourName, group]);

  async function toggleVisbility() {
    gateway.send(Op.UpdateGroup, {
      visibility: group.visibility == "public" ? "private" : "public",
    });
  }

  async function leaveGroup() {
    router.push("/");
  }

  const [seshers, setSeshers] = useState(0);
  const [watchers, setWatchers] = useState(0);

  useEffect(() => {
    const currentSeshers = groupMembers.filter((mem) =>
      validState(mem.device_state)
    ).length;
    const currentWatchers = groupMembers.filter(
      (mem) => !validState(mem.device_state)
    ).length;

    setSeshers(currentSeshers + (deviceConnected ? 1 : 0));
    setWatchers(currentWatchers + (!deviceConnected ? 1 : 0));
  }, [groupMembers]);

  return !initGroup ? (
    <div className="flex flex-col justify-center text-black bg-white dark:text-white dark:bg-neutral-900 h-screen">
      <GroupMeta />

      <div className="flex flex-col justify-center items-center text-center text-black dark:text-white">
        <h2 className="text-xl m-4">Unknown Group</h2>

        <button
          className="w-48 self-center rounded-md bg-indigo-700 hover:bg-indigo-800 p-1 mb-5 text-white"
          onClick={() => router.push("/")}
        >
          Back
        </button>
      </div>
    </div>
  ) : (
    <div className="flex flex-col justify-center text-black bg-white dark:text-white dark:bg-neutral-900 h-screen">
      <GroupMeta group={initGroup} />

      <UserSettingsModal
        modalOpen={userSettingsModalOpen}
        setModalOpen={setUserSettingsModalOpen}
      />
      <InfoModal modalOpen={infoModalOpen} setModalOpen={setInfoModalOpen} />

      {groupConnected ? (
        <>
          <div className="flex flex-row items-center m-4">
            <div className="flex flex-col">
              <div>
                <h1 className="text-4xl text-black dark:text-white font-bold">
                  {group.name}
                </h1>
                <h3 className="text-black dark:text-white font-bold capitalize">
                  State: {group.state}
                </h3>
                <p className="text-black dark:text-white font-bold">
                  {seshers} sesher{seshers > 1 ? "s" : ""} - {watchers} watcher
                  {watchers ? "s" : ""}
                </p>
              </div>
              <p className="text-black dark:text-white font-bold">
                {group.sesh_counter.toLocaleString()} seshes this group
              </p>
            </div>

            <div className="flex flex-row text-black bg-white dark:text-white dark:bg-neutral-900 drop-shadow-xl rounded-md p-2 m-2 justify-center items-center">
              <button
                className={`flex justify-center items-center text-white w-fit m-2 p-2 ${
                  group.state == "awaiting" ? "bg-green-700" : "bg-green-800"
                } rounded-md`}
                onClick={() =>
                  group.state == "awaiting" ? startWithReady() : sendStartDab()
                }
              >
                {group.state == "awaiting" ? "Start with ready" : "Start"}
              </button>
              {group.state == "awaiting" ? (
                <button
                  className={`flex justify-center items-center text-white w-fit m-2 p-2 bg-red-500 rounded-md`}
                  onClick={() => stopSesh()}
                >
                  Stop
                </button>
              ) : (
                <></>
              )}
              <button
                className={`flex justify-center items-center text-white w-fit m-2 p-2 ${
                  group.visibility == "public" ? "bg-blue-700" : "bg-indigo-800"
                } rounded-md`}
                onClick={() => toggleVisbility()}
              >
                Make {group.visibility == "public" ? "private" : "public"}
              </button>
              <button
                className="flex justify-center items-center text-white w-fit m-2 p-2 bg-red-800 rounded-md"
                onClick={() => leaveGroup()}
              >
                Leave
              </button>
              {deviceConnected ? (
                <button
                  className="flex justify-center items-center text-white w-fit m-2 p-2 bg-red-800 rounded-md"
                  onClick={() => disconnect()}
                >
                  Disconnect
                </button>
              ) : (
                <></>
              )}
              <Tippy content="User Settings" placement="bottom">
                <div
                  className="flex items-center rounded-md p-1 bg-white dark:bg-neutral-800 cursor-pointer h-fit m-1 drop-shadow-xl"
                  onClick={() => setUserSettingsModalOpen(true)}
                >
                  <Settings />
                </div>
              </Tippy>
              <Tippy content="Information" placement="bottom">
                <div
                  className="flex items-center rounded-md p-1 bg-white dark:bg-neutral-800 cursor-pointer h-fit m-1 drop-shadow-xl"
                  onClick={() => setInfoModalOpen(true)}
                >
                  <Info />
                </div>
              </Tippy>
            </div>
          </div>

          <div className="flex flex-row">
            <>
              <GroupMember
                device={myDevice}
                name={ourName}
                ready={readyMembers.includes(gateway.session_id)}
                connectToDevice={connectToDevice}
                us
              />
              {groupMembers
                .filter((mem) => validState(mem.device_state))
                .map((member) => (
                  <GroupMember
                    device={member.device_state}
                    ready={readyMembers.includes(member.session_id)}
                    member={member}
                    key={member.session_id}
                  />
                ))}
            </>
          </div>
        </>
      ) : (
        <div className="flex flex-col justify-center items-center text-center text-black dark:text-white">
          <h2 className="text-xl m-4">
            {!!groupJoinErrorMessage
              ? groupJoinErrorMessage
              : `Connecting to ${initGroup.name}...`}
          </h2>

          <button
            className="w-48 self-center rounded-md bg-indigo-700 hover:bg-indigo-800 p-1 mb-5 text-white"
            onClick={() => router.push("/")}
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
}

export async function getServerSideProps(context: NextPageContext) {
  try {
    const group = await getGroupById(context.query.id as string);
    return {
      props: { group },
    };
  } catch (error) {
    return {
      props: {
        group: null,
      },
    };
  }
}
