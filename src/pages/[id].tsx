import { emojisplosion } from "emojisplosion";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Tippy } from "../components/Tippy";

import {
  GatewayError,
  GatewayGroup,
  GatewayGroupMember,
  GatewayGroupUserAwayState,
  GatewayMemberDeviceState,
  GroupActionInitiator,
  GroupHeatBegin,
  GroupHeatInquire,
  GroupReaction,
  GroupState,
  GroupUserDeviceUpdate,
  GroupUserJoin,
  GroupUserLeft,
  PuffcoOperatingState,
} from "../types/gateway";
import { Device } from "../utils/puffco";
import { DeviceCommand, PuffLightMode } from "../utils/puffco/constants";
import { gateway, Op } from "../utils/gateway";
import { UserSettingsModal } from "../components/modals/UserSettings";
import { trackDevice } from "../utils/hash";
import { GroupMeta } from "../components/GroupMeta";
import { NextPageContext } from "next";
import { getGroupById } from "../utils/api";
import { APIGroup, User } from "../types/api";
import { GroupMember } from "../components/GroupMember";
import { LeaderboardModal } from "../components/modals/Leaderboard";
import { FeedbackModal } from "../components/modals/Feedback";
import NoSSR from "../components/NoSSR";
import { GroupSettingsModal } from "../components/modals/GroupSettings";
import {
  BluetoothConnected,
  BluetoothDisabled,
} from "../components/icons/Bluetooth";
import { GroupActions } from "../components/GroupActions";
import { PuffcoProfile } from "../types/puffco";
import { DeviceInformation } from "../types/api";
import { DeviceSettingsModal } from "../components/modals/DeviceSettings";
import { Kick } from "../components/icons/Kick";
import Link from "next/link";
import { ChatBox } from "../components/Chat";
import { ChatIcon } from "../components/icons/Chat";
import { GroupHeader } from "../components/group/Header";
import { GroupMembersModal } from "../components/modals/GroupMembers";
import { GroupStrainModal } from "../components/modals/GroupStrain";
import { PlugConnected, PlugDisconnected } from "../components/icons/Plug";

const instance = new Device();
if (typeof window != "undefined") window["instance"] = instance;

export default function Group({
  group: initGroup,
  headless,
}: {
  group: APIGroup;
  headless: boolean;
}) {
  const router = useRouter();

  const membersList = useRef<HTMLDivElement>();

  const [deviceConnected, setDeviceConnected] = useState(false);
  const [groupConnected, setGroupConnected] = useState(false);
  const [group, setGroup] = useState<GatewayGroup>();
  const [groupJoinErrorMessage, setGroupJoinErrorMessage] = useState<string>();
  const [groupMembers, setGroupMembers] = useState<GatewayGroupMember[]>([]);

  const [chatBoxOpen, setChatBoxOpen] = useState(false);
  const [chatUnread, setChatUnread] = useState(false);

  const [ourLeaderboardPosition, setOurLeaderboardPosition] =
    useState<number>(0);
  const [usAway, setUsAway] = useState(false);
  const [ourStrain, setOurStrain] = useState<string>();
  const [ourUser, setOurUser] = useState<User>();
  const [usDisconnected, setUsDisconnected] = useState<boolean>(false);
  const [ourName, setOurName] = useState(() =>
    typeof localStorage != "undefined"
      ? localStorage.getItem("puff-social-name") || "Unnamed"
      : "Unnamed"
  );

  const [readyMembers, setReadyMembers] = useState<string[]>([]);
  const [deviceProfiles, setDeviceProfiles] = useState<
    Record<number, PuffcoProfile>
  >({});
  const [deviceInfo, setDeviceInfo] = useState<DeviceInformation>();
  const [myDevice, setMyDevice] = useState<GatewayMemberDeviceState>();

  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [groupMembersModalOpen, setGroupMembersModalOpen] = useState(false);
  const [userSettingsModalOpen, setUserSettingsModalOpen] = useState(false);
  const [strainSetModalOpen, setStrainSetModalOpen] = useState(false);
  const [deviceSettingsModalOpen, setDeviceSettingsModalOpen] = useState(false);
  const [groupSettingsModalOpen, setGroupSettingsModalOpen] = useState(false);

  const [firstVisit] = useState(() =>
    typeof localStorage != "undefined"
      ? localStorage.getItem("puff-social-first-visit") != "false"
      : false
  );

  const [groupStartOnBatteryCheck] = useState(() =>
    typeof localStorage != "undefined"
      ? localStorage.getItem("puff-battery-check-start") == "true" || false
      : false
  );

  function validState(state: GatewayMemberDeviceState) {
    if (!state) return false;
    const required = [
      "temperature",
      "battery",
      "totalDabs",
      "state",
      "deviceModel",
    ];
    for (const key of required)
      if (typeof state[key] == "undefined") return false;
    return true;
  }

  async function joinedGroup(group: GatewayGroup) {
    setGroupJoinErrorMessage("");
    setGroupConnected(true);
    setGroup(group);
    setGroupMembers(group.members);
    setReadyMembers(group.ready_members);
  }

  const deletedGroup = useCallback(() => {
    if (group.owner_session_id != gateway.session_id)
      toast("The group you were in was deleted", {
        position: "top-right",
        duration: 5000,
        icon: "🗑",
      });
    router.push("/");
  }, [group]);

  const updatedGroup = useCallback(
    (newGroup: GatewayGroup) => {
      if (
        ([GroupState.Chilling, GroupState.Seshing].includes(newGroup.state) &&
          group.state == GroupState.Awaiting) ||
        ([GroupState.Awaiting, GroupState.Seshing].includes(group.state) &&
          newGroup.state == GroupState.Chilling)
      ) {
        setReadyMembers([]);
        instance.setLightMode(PuffLightMode.Default);
      }

      setGroup(newGroup);
    },
    [readyMembers, group, deviceConnected, myDevice]
  );

  const sessionResumeFailed = useCallback(async () => {
    toast("Failed to resume socket session", {
      position: "top-right",
      duration: 2000,
      icon: "❌",
    });

    router.push("/");
  }, []);

  const sessionResumed = useCallback(async () => {
    setUsDisconnected(false);
    toast("Socket reconnected", {
      position: "top-right",
      duration: 1500,
      icon: <PlugConnected />,
    });

    if (group.state == GroupState.Awaiting) {
      await instance.setLightMode(PuffLightMode.QueryReady);
    } else {
      await instance.setLightMode(PuffLightMode.Default);
    }

    setReadyMembers((curr) => [
      ...curr.filter((item) => item != gateway.session_id),
    ]);
  }, [group]);

  function groupMemberUpdated(member: GatewayGroupMember) {
    if (member.session_id == gateway.session_id) {
      if (typeof member.name != "undefined") setOurName(member.name);
      if (typeof member.strain != "undefined") setOurStrain(member.strain);
      if (typeof member.user != "undefined") setOurUser(member.user);
      if (typeof member.disconnected != "undefined")
        setUsDisconnected(member.disconnected);
    }

    setGroupMembers((curr) => {
      const existing = curr.find((mem) => mem.session_id == member.session_id);
      if (!existing) return curr;
      for (const key in member) existing[key] = member[key];
      return [...curr];
    });
  }

  function groupUserAwayState(state: GatewayGroupUserAwayState) {
    if (state.session_id == gateway.session_id) setUsAway(state.state);
    setGroupMembers((curr) => {
      const existing = curr.find((mem) => mem.session_id == state.session_id);
      if (!existing) return curr;
      existing.away = state.state;
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

  function groupMemberJoin(member: GroupUserJoin) {
    toast(`${member.user?.name || member.name} joined`, {
      position: "top-right",
    });
    setGroupMembers((curr) => [...curr, member]);
  }

  function groupMemberLeft({ session_id }: GroupUserLeft) {
    setGroupMembers((curr) => {
      const member = curr.find((mem) => mem.session_id == session_id);
      if (member)
        toast(`${member.user?.name || member.name} left`, {
          position: "top-right",
        });
      return [...curr.filter((mem) => mem.session_id != session_id)];
    });
  }

  function groupUserKicked() {
    toast(`You were kicked from this group`, {
      position: "top-right",
      icon: <Kick />,
    });
    router.push("/");
  }

  const groupReaction = useCallback(
    async ({ emoji, author_session_id }: GroupReaction) => {
      setGroupMembers((curr) => {
        const member = curr.find((mem) => mem.session_id == author_session_id);
        if (
          author_session_id == gateway.session_id
            ? validState(myDevice)
            : member && validState(member.device_state)
        ) {
          const children = membersList.current.children;
          const element = children.namedItem(author_session_id);

          emojisplosion({
            emojis: [emoji],
            emojiCount: 10,
            physics: {
              gravity: -0.35,
              framerate: 40,
              opacityDecay: 22,
              initialVelocities: {
                y: {
                  max: 1,
                  min: -10,
                },
                x: {
                  max: 1,
                  min: -25,
                },
                rotation: {
                  max: 10,
                  min: 0,
                },
              },
            },
            position: {
              x: element.getBoundingClientRect().x + element.clientWidth,
              y: element.getBoundingClientRect().y + element.clientHeight,
            },
          });
        } else {
          emojisplosion({
            emojis: [emoji],
            emojiCount: 10,
            physics: {
              gravity: -0.45,
              framerate: 40,
              opacityDecay: 22,
              initialVelocities: {
                y: {
                  max: 0,
                  min: 50,
                },
                x: {
                  max: 1,
                  min: -20,
                },
                rotation: {
                  max: 0,
                  min: 0,
                },
              },
            },
            position: {
              x: window.innerWidth,
              y: 0,
            },
          });

          toast(`${member.user?.name || member.name}: ${emoji}`, {
            position: "top-right",
            duration: 1000,
          });
        }

        return curr;
      });
    },
    [groupMembers, deviceConnected]
  );

  async function startDab(data: GroupHeatBegin) {
    toast("3...", { duration: 1000, position: "top-right" });
    setTimeout(() => {
      toast("2...", { duration: 1000, position: "top-right" });
      setTimeout(() => {
        toast("1...", { duration: 900, position: "top-right" });
        toast("Dab", { duration: 1000, position: "top-right" });

        if (!data.away && !data.watcher && !data.excluded)
          instance.sendCommand(DeviceCommand.HEAT_CYCLE_BEGIN);
      }, 1000);
    }, 1000);
  }

  const inquireDab = useCallback(
    (data: GroupHeatInquire) => {
      setGroupMembers((groupMembers) => {
        const initiator = groupMembers.find(
          (mem) => mem.session_id == data.session_id
        );
        toast(`${initiator.user?.name || initiator.name} wants to start`, {
          icon: "🔥",
          duration: 5000,
          position: "top-right",
        });

        if (!data.away && !data.watcher && !data.excluded) {
          console.log(data, "start?");

          (async () => {
            console.log("sending", instance);
            await instance.sendCommand(DeviceCommand.BONDING);
            await instance.setLightMode(PuffLightMode.QueryReady);
          })();

          toast(`Confirm by pressing your button`, {
            icon: "🔘",
            duration: 8000,
            position: "top-right",
          });
        }

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

        toast(`${initiator.user?.name || initiator.name} is ready`, {
          icon: "✅",
          duration: 5000,
          position: "top-right",
        });
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

        if (initiator)
          toast(
            `${initiator.user?.name || initiator.name} is no longer ready`,
            { icon: "🚫", duration: 5000, position: "top-right" }
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
            data.session_id == gateway.session_id
              ? ourUser?.name || ourName
              : initiator.user?.name || initiator.name
          } made the group ${data.visibility}`,
          {
            icon: data.visibility == "public" ? "🌍" : "🔒",
            duration: 5000,
            position: "top-right",
          }
        );
        return groupMembers;
      });
    },
    [groupMembers]
  );

  const disconnect = useCallback(async () => {
    if (deviceConnected) await instance.setLightMode(PuffLightMode.Default);
    instance.disconnect();
    setDeviceConnected(false);
    setMyDevice(null);
    gateway.send(Op.DisconnectDevice);
  }, [deviceConnected]);

  function groupMessage() {}

  function gatewayClosed() {
    setUsDisconnected(true);
    toast("Socket disconnected (Reconnecting..)", {
      position: "top-right",
      duration: 1000,
      icon: <PlugDisconnected />,
    });
  }

  useEffect(() => {
    if (initGroup && initGroup.group_id) {
      if (firstVisit) {
        if (typeof localStorage != "undefined")
          localStorage.setItem("puff-social-first-visit", "false");
        toast(
          <span className="max-w-md">
            We see this is your first visit, you should read our{" "}
            <Link className="text-blue-700 dark:text-blue-400" href={"/info"}>
              info page
            </Link>{" "}
            to learn more about what puff.social is :)
          </span>,
          {
            position: "top-center",
            icon: "👋",
            style: { width: "300px" },
            duration: 10000,
          }
        );
      }
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
      gateway.on("group_user_kicked", groupUserKicked);
      gateway.on("group_user_away_state", groupUserAwayState);

      gateway.on("close", gatewayClosed);

      if (gateway.ws.readyState == gateway.ws.OPEN)
        gateway.send(Op.Join, { group_id: initGroup.group_id });
      else
        gateway.once("init", () => {
          gateway.send(Op.Join, { group_id: initGroup.group_id });
        });

      return () => {
        setReadyMembers([]);
        gateway.send(Op.LeaveGroup);
        disconnect();
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
        gateway.removeListener("group_user_kicked", groupUserKicked);
        gateway.removeListener("group_user_away_state", groupUserAwayState);

        gateway.removeListener("close", gatewayClosed);
      };
    }
  }, [initGroup]);

  useEffect(() => {
    gateway.on("session_resumed", sessionResumed);
    gateway.on("resume_failed", sessionResumeFailed);
    return () => {
      gateway.removeListener("session_resumed", sessionResumed);
      gateway.removeListener("resume_failed", sessionResumeFailed);
    };
  }, [sessionResumed]);

  useEffect(() => {
    gateway.on("group_update", updatedGroup);
    return () => {
      gateway.removeListener("group_update", updatedGroup);
    };
  }, [updatedGroup]);

  useEffect(() => {
    gateway.on("group_message", groupMessage);
    return () => {
      gateway.removeListener("group_message", groupMessage);
    };
  }, [chatBoxOpen]);

  useEffect(() => {
    gateway.on("group_delete", deletedGroup);
    return () => {
      gateway.removeListener("group_delete", deletedGroup);
    };
  }, [deletedGroup]);

  useEffect(() => {
    gateway.on("group_reaction", groupReaction);
    return () => {
      gateway.removeListener("group_reaction", groupReaction);
    };
  }, [groupReaction]);

  const connectToDevice = useCallback(async () => {
    try {
      const { device, profiles } = await instance.init();
      toast(`Connected to ${device.name}`, {
        icon: <BluetoothConnected />,
        position: "top-right",
      });
      setDeviceProfiles(profiles);

      if (group.state == GroupState.Awaiting) {
        await instance.setLightMode(PuffLightMode.QueryReady);
        await instance.sendCommand(DeviceCommand.BONDING);
      } else {
        await instance.setLightMode(PuffLightMode.Default);
      }

      const { poller, initState, deviceInfo } = await instance.startPolling();
      const tracked = await trackDevice(deviceInfo, ourName);
      setOurLeaderboardPosition(tracked.data.position);

      setDeviceConnected(true);
      setDeviceInfo(deviceInfo as DeviceInformation);
      setMyDevice((curr) => ({ ...curr, ...initState }));
      gateway.send(Op.SendDeviceState, initState);
      poller.on("data", async (data) => {
        if (data.totalDabs)
          setDeviceInfo((deviceInfo) => {
            trackDevice({ ...deviceInfo, totalDabs: data.totalDabs }, ourName);
            return deviceInfo;
          });
        setGroup((currGroup) => {
          if (
            currGroup.state == GroupState.Awaiting &&
            data.state == PuffcoOperatingState.TEMP_SELECT
          ) {
            instance.setLightMode(PuffLightMode.MarkedReady);
          }

          if (
            currGroup.state == GroupState.Chilling &&
            data.state == PuffcoOperatingState.INIT_BATTERY_DISPLAY &&
            groupStartOnBatteryCheck
          ) {
            setTimeout(() => gateway.send(Op.InquireHeating));
          }

          return currGroup;
        });
        setMyDevice((curr) => {
          return { ...curr, ...data };
        });
        gateway.send(Op.SendDeviceState, data);
      });
      device.ongattserverdisconnected = async () => {
        if (deviceConnected) await instance.setLightMode(PuffLightMode.Default);
        poller.emit("stop");
        setDeviceConnected(false);
        gateway.send(Op.DisconnectDevice);
        toast(`Disconnected from ${device.name}`, {
          icon: <BluetoothDisabled />,
          position: "top-right",
        });
      };
    } catch (error) {
      if ("code" in error) {
        switch (error.code) {
          case "ac_firmware": {
            toast(
              "Your device has Firmware AC and is not supported currently, we're trying to work with puffco to support this ASAP!",
              { position: "top-right", duration: 5000, icon: "‼" }
            );
            break;
          }
        }
      }
      console.error(error);
    }
  }, [ourName, group]);

  const [seshers, setSeshers] = useState(0);
  const [watchers, setWatchers] = useState(0);

  useEffect(() => {
    const currentSeshers = groupMembers.filter((mem) =>
      validState(mem.device_state)
    ).length;
    const currentWatchers = groupMembers.filter(
      (mem) => !validState(mem.device_state)
    ).length;

    setSeshers(currentSeshers);
    setWatchers(currentWatchers);
  }, [groupMembers, deviceConnected]);

  function closeChatBox(event: KeyboardEvent) {
    event.code == "Escape" ? setChatBoxOpen(false) : null;
  }

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
    <div className="flex flex-col justify-between h-screen">
      <GroupMeta initGroup={initGroup} group={group} />

      {group ? (
        <GroupSettingsModal
          modalOpen={groupSettingsModalOpen}
          setModalOpen={setGroupSettingsModalOpen}
          group={group}
        />
      ) : (
        <></>
      )}
      <UserSettingsModal
        modalOpen={userSettingsModalOpen}
        setModalOpen={setUserSettingsModalOpen}
      />
      <GroupStrainModal
        modalOpen={strainSetModalOpen}
        setModalOpen={setStrainSetModalOpen}
        strain={ourStrain}
      />
      {deviceConnected ? (
        <DeviceSettingsModal
          device={myDevice}
          info={deviceInfo}
          setDeviceInfo={setDeviceInfo}
          setMyDevice={setMyDevice}
          modalOpen={deviceSettingsModalOpen}
          setModalOpen={setDeviceSettingsModalOpen}
        />
      ) : (
        <></>
      )}

      {groupMembers && group ? (
        <GroupMembersModal
          modalOpen={groupMembersModalOpen}
          setModalOpen={setGroupMembersModalOpen}
          group={group}
          members={groupMembers}
        />
      ) : (
        <></>
      )}
      <LeaderboardModal
        modalOpen={leaderboardOpen}
        setModalOpen={setLeaderboardOpen}
      />
      <FeedbackModal
        modalOpen={feedbackModalOpen}
        setModalOpen={setFeedbackModalOpen}
      />

      {groupConnected ? (
        <NoSSR>
          {!headless ? (
            <div className="flex flex-col m-4 z-10">
              {group ? (
                <>
                  <GroupHeader
                    group={group}
                    watchers={watchers}
                    seshers={seshers}
                    setGroupMembersModalOpen={setGroupMembersModalOpen}
                  />

                  <GroupActions
                    group={group}
                    seshers={seshers}
                    members={groupMembers}
                    instance={instance}
                    readyMembers={readyMembers}
                    deviceConnected={deviceConnected}
                    deviceProfiles={deviceProfiles}
                    disconnect={disconnect}
                    setGroupSettingsModalOpen={setGroupSettingsModalOpen}
                    setDeviceSettingsModalOpen={setDeviceSettingsModalOpen}
                    setUserSettingsModalOpen={setUserSettingsModalOpen}
                    setFeedbackModalOpen={setFeedbackModalOpen}
                    setLeaderboardOpen={setLeaderboardOpen}
                  />
                </>
              ) : (
                <></>
              )}
            </div>
          ) : (
            <></>
          )}

          <div className="flex flex-row flex-wrap m-4" ref={membersList}>
            <>
              <GroupMember
                device={myDevice}
                name={ourName}
                strain={ourStrain}
                leaderboardPosition={ourLeaderboardPosition}
                ready={readyMembers.includes(gateway.session_id)}
                connectToDevice={connectToDevice}
                nobody={seshers == 0}
                owner={group.owner_session_id == gateway.session_id}
                setStrainModalOpen={setStrainSetModalOpen}
                group={group}
                away={usAway}
                user={ourUser}
                member={groupMembers.find(
                  (mem) => mem.session_id == gateway.session_id
                )}
                disconnected={usDisconnected}
                headless={headless}
                us
              />
              {groupMembers
                .filter(
                  (mem) =>
                    validState(mem.device_state) &&
                    gateway.session_id != mem.session_id
                )
                .map((member) => (
                  <GroupMember
                    device={member.device_state}
                    ready={readyMembers.includes(member.session_id)}
                    member={member}
                    owner={group.owner_session_id == member.session_id}
                    group={group}
                    headless={headless}
                    key={member.session_id}
                  />
                ))}
              {seshers == 1 ? <GroupMember nobodyelse /> : <></>}
            </>
          </div>

          {!headless ? (
            <div className="absolute right-0 bottom-0 m-4">
              <Tippy
                interactive
                placement="left-start"
                content={
                  <ChatBox
                    chatBoxOpen={chatBoxOpen}
                    group={group}
                    ourName={ourName}
                    user={ourUser}
                    members={groupMembers}
                  />
                }
                visible={chatBoxOpen}
                onClickOutside={() => setChatBoxOpen(false)}
                onShown={() => {
                  document.removeEventListener("keydown", closeChatBox);
                  document.addEventListener("keydown", closeChatBox);
                }}
              >
                <div>
                  <Tippy content="Group Chat" placement="top-end">
                    <span
                      onClick={() => setChatBoxOpen((prev) => !prev)}
                      className="flex bg-green-400 hover:bg-green-600 text-white p-4 rounded-full w-fit h-fit justify-center items-center transition-all"
                    >
                      <ChatIcon />
                    </span>
                  </Tippy>
                </div>
              </Tippy>
            </div>
          ) : (
            <></>
          )}

          <div />
        </NoSSR>
      ) : (
        <>
          <div />
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
          <div />
        </>
      )}
    </div>
  );
}

export async function getServerSideProps(context: NextPageContext) {
  try {
    const group = await getGroupById(context.query.id as string);

    return {
      props: { group, headless: context.query.headless == "true" },
    };
  } catch (error) {
    return {
      props: {
        group: null,
      },
    };
  }
}
