import Head from "next/head";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import { useCallback, useEffect, useState } from "react";

import { PuffcoContainer } from "../../components/puffco";
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
  PuffcoOperatingMap,
  PuffcoOperatingState,
} from "../../types/gateway";
import {
  ChargeSource,
  DeviceCommand,
  disconnectBluetooth,
  sendCommand,
  startConnection,
  startPolling,
} from "../../utils/puffco";
import { gateway, Op } from "../../utils/gateway";
import { Counter } from "../../components/icons/Counter";
import { Battery, BatteryBolt } from "../../components/icons/Battery";
import { Checkmark } from "../../components/icons/Checkmark";

export default function Group() {
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [groupConnected, setGroupConnected] = useState(false);
  const [group, setGroup] = useState<GatewayGroup>();
  const [groupJoinErrorMessage, setGroupJoinErrorMessage] = useState<string>();
  const [groupMembers, setGroupMembers] = useState<GatewayGroupMember[]>([]);

  const [deviceType] = useState(() =>
    typeof localStorage != "undefined"
      ? localStorage.getItem("puff-social-device-type") || "peak"
      : "peak"
  );
  const [ourName] = useState(() =>
    typeof localStorage != "undefined"
      ? localStorage.getItem("puff-social-name") || "Unnamed"
      : "Unnamed"
  );

  const [readyMembers, setReadyMembers] = useState<string[]>([]);
  const [time, setTime] = useState(Date.now());

  const [myDevice, setMyDevice] = useState({
    temperature: 0,
    activeColor: { r: 0, g: 0, b: 0 },
    state: PuffcoOperatingState.IDLE,
    totalDabs: 0,
    battery: 0,
    brightness: 0,
    chargeSource: ChargeSource.None,
  });

  const router = useRouter();
  const { id } = router.query;

  function validState(state: GatewayMemberDeviceState) {
    if (!state) return false;
    const required = ["temperature", "battery", "totalDabs", "state"];
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
    },
    [readyMembers, group]
  );

  function groupMemberUpdated(member: GatewayGroupMember) {
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

  useEffect(() => {
    if (id) {
      setInterval(() => setTime(Date.now()), 500);
      gateway.on("joined_group", joinedGroup);
      gateway.on("group_join_error", groupJoinError);
      gateway.on("group_user_update", groupMemberUpdated);
      gateway.on("group_user_device_update", groupMemberDeviceUpdated);
      gateway.on("group_heat_begin", startDab);
      gateway.on("group_heat_inquiry", inquireDab);
      gateway.on("group_visibility_change", groupChangeVisibility);

      gateway.on("group_user_ready", groupMemberReady);
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
        gateway.removeListener("group_heat_inquiry", inquireDab);
        gateway.removeListener(
          "group_visibility_change",
          groupChangeVisibility
        );
        gateway.removeListener("group_heat_begin", startDab);
        gateway.removeListener("group_user_ready", groupMemberReady);
        gateway.removeListener("group_user_join", groupMemberJoin);
        gateway.removeListener("group_user_left", groupMemberLeft);
      };
    }
  }, [id]);

  useEffect(() => {
    gateway.on("group_update", updatedGroup);
    return () => {
      gateway.removeListener("group_update", updatedGroup);
    };
  }, [updatedGroup]);

  async function connectToDevice() {
    try {
      const device = await startConnection();
      toast(`Connected to ${device.name}`, { icon: "✅" });
      setDeviceConnected(true);
      const poller = await startPolling();
      poller.on("data", (data) => {
        setMyDevice((curr) => ({ ...curr, ...data }));
        gateway.send(Op.SendDeviceState, data);
      });
    } catch (error) {
      console.error(error);
    }
  }

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

  return (
    <div className="flex flex-col justify-center text-black bg-white dark:text-white dark:bg-neutral-900 h-screen">
      <Head>
        <title>
          {groupConnected ? group.name : "Connecting"} - puff.social
        </title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {groupConnected ? (
        <>
          <div className="flex flex-row items-center m-4">
            <div>
              <h1 className="text-4xl text-black dark:text-white font-bold">
                {group.name}
              </h1>
              <h3 className="text-black dark:text-white font-bold">
                State: {group.state}
              </h3>
              <p className="text-black dark:text-white font-bold">
                {seshers} sesher{seshers > 1 ? "s" : ""} - {watchers} watcher
                {watchers ? "s" : ""}
              </p>
            </div>

            <div className="flex flex-row text-black bg-white dark:text-white dark:bg-neutral-900 drop-shadow-xl rounded-md p-2 m-2">
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
            </div>
          </div>

          <div className="flex flex-row">
            <>
              <div className="flex flex-col text-black bg-white dark:text-white dark:bg-neutral-900 drop-shadow-xl rounded-md m-4 w-64 h-[800px] justify-between items-center">
                <div className="flex flex-col p-8 text-center justify-center items-center">
                  <p style={{ visibility: "hidden", display: "none" }}>
                    {time}
                  </p>
                  <span className="flex flex-row text-center self-center items-center">
                    <h1 className="m-0 text-center text-2xl font-bold">
                      {ourName}
                    </h1>
                    {readyMembers.includes(gateway.session_id) ? (
                      <Checkmark className="ml-2 text-green-700 w-[20px] h-[20px]" />
                    ) : (
                      <></>
                    )}
                  </span>
                  {deviceConnected && (
                    <div className="flex space-x-3 justify-center">
                      <span className="flex flex-row justify-center items-center">
                        <Counter className="m-1" />
                        <p className="m-0 p-1 text-lg">
                          {myDevice.totalDabs.toLocaleString()}
                        </p>
                      </span>
                      <span className="flex flex-row justify-center items-center">
                        {myDevice.chargeSource == ChargeSource.None ? (
                          <Battery className="m-1" />
                        ) : (
                          <BatteryBolt className="m-1" />
                        )}
                        <p className="m-0 p-1 text-lg">{myDevice.battery}%</p>
                      </span>
                    </div>
                  )}
                </div>
                {deviceConnected ? (
                  <>
                    <div>
                      <PuffcoContainer
                        id="self"
                        model={deviceType}
                        demo={myDevice}
                      />
                    </div>
                    <div className="flex flex-col p-4 justify-center items-center text-center">
                      <h2 className="text-[45px] m-0">
                        {myDevice.temperature
                          ? Math.floor(myDevice.temperature * 1.8 + 32)
                          : "--"}
                        °
                      </h2>
                      <h3 className="text-[25px] m-0">
                        {PuffcoOperatingMap[myDevice.state]}
                      </h3>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col items-center justify-center w-64 mb-16">
                      <img width="250px" src="/peak.gif" />
                      <p className="text-center text-lg break-normal">
                        Connect a device to join the sesh
                      </p>
                    </div>
                    <button
                      className="w-48 self-center rounded-md bg-indigo-700 hover:bg-indigo-800 text-white p-1 mb-5"
                      onClick={() => connectToDevice()}
                    >
                      Connect
                    </button>
                  </>
                )}
              </div>
              {groupMembers
                .filter(
                  (mem) =>
                    validState(mem.device_state) &&
                    mem.session_id != gateway.session_id
                )
                .map((member) => (
                  <div className="flex flex-col text-black bg-white dark:text-white dark:bg-neutral-900 drop-shadow-xl rounded-md m-4 w-64 h-[800px] justify-between items-center">
                    <div className="flex flex-col p-8 text-center justify-center items-center">
                      <p style={{ visibility: "hidden", display: "none" }}>
                        {time}
                      </p>
                      <span className="flex flex-row text-center self-center items-center">
                        <h1 className="m-0 text-center text-2xl font-bold">
                          {member.name}
                        </h1>
                        {readyMembers.includes(member.session_id) ? (
                          <Checkmark className="ml-2 text-green-700 w-[20px] h-[20px]" />
                        ) : (
                          <></>
                        )}
                      </span>
                      <div className="flex space-x-3 justify-center">
                        <span className="flex flex-row justify-center items-center">
                          <Counter className="m-1" />
                          <p className="m-0 p-1 text-lg">
                            {member.device_state.totalDabs.toLocaleString()}
                          </p>
                        </span>
                        <span className="flex flex-row justify-center items-center">
                          {member.device_state.chargeSource ==
                          ChargeSource.None ? (
                            <Battery className="m-1" />
                          ) : (
                            <BatteryBolt className="m-1" />
                          )}

                          <p className="m-0 p-1 text-lg">
                            {member.device_state.battery}%
                          </p>
                        </span>
                      </div>
                    </div>
                    <div>
                      <PuffcoContainer
                        id={member.session_id}
                        model={member.device_type}
                        demo={member.device_state}
                      />
                    </div>
                    <div className="flex flex-col p-4 justify-center items-center text-center">
                      <h2 className="text-[45px] m-0">
                        {member.device_state.temperature
                          ? Math.floor(
                              member.device_state.temperature * 1.8 + 32
                            )
                          : "--"}
                        °
                      </h2>
                      <h3 className="text-[25px] m-0">
                        {PuffcoOperatingMap[member.device_state.state]}
                      </h3>
                    </div>
                  </div>
                ))}
            </>
          </div>
        </>
      ) : (
        <div className="flex flex-col justify-center items-center text-center text-black dark:text-white">
          <h2 className="text-xl m-4">
            {!!groupJoinErrorMessage
              ? groupJoinErrorMessage
              : `Connecting to ${id}...`}
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
