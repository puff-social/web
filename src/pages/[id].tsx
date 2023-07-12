import { emojisplosion } from "emojisplosion";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Tippy } from "../components/Tippy";

import {
  GatewayError,
  GroupActionInitiator,
  GroupHeatBegin,
  GroupHeatInquire,
  GroupReaction,
  GroupState,
  GroupUserDeviceUpdate,
  GroupUserJoin,
  GroupUserLeft,
} from "../types/gateway";
import { Device } from "../utils/puffco";
import { DeviceCommand, PuffLightMode } from "../utils/puffco/constants";
import { gateway } from "../utils/gateway";
import { UserSettingsModal } from "../components/modals/UserSettings";
import { trackDevice } from "../utils/hash";
import { GroupMeta } from "../components/GroupMeta";
import { NextPageContext } from "next";
import { getGroupById } from "../utils/api";
import { APIGroup, User, DeviceInformation } from "../types/api";
import { GroupMember } from "../components/GroupMember";
import { LeaderboardModal } from "../components/modals/Leaderboard";
import { FeedbackModal } from "../components/modals/Feedback";
import NoSSR from "../components/NoSSR";
import { GroupSettingsModal } from "../components/modals/GroupSettings";
import { BluetoothDisabled } from "../components/icons/Bluetooth";
import { GroupActions } from "../components/GroupActions";
import { PuffcoProfile } from "../types/puffco";
import { DeviceSettingsModal } from "../components/modals/Device";
import { Kick } from "../components/icons/Kick";
import Link from "next/link";
// import { ChatBox } from "../components/Chat";
// import { ChatIcon } from "../components/icons/Chat";
import { GroupHeader } from "../components/group/Header";
import { GroupMembersModal } from "../components/modals/GroupMembers";
import { GroupStrainModal } from "../components/modals/GroupStrain";
import { PlugConnected, PlugDisconnected } from "../components/icons/Plug";
import {
  DeviceState,
  ProductModelMap,
} from "@puff-social/commons/dist/puffco/constants";
import { Op } from "@puff-social/commons";
import { useDispatch, useSelector } from "react-redux";
import {
  selectGroupState,
  setGroupState,
  updateGroupMemberDevice,
} from "../state/slices/group";
import { validState } from "@puff-social/commons/dist/puffco";
import { DeviceModelColors } from "../utils/constants";
import { PuffcoLogo } from "../components/icons/Puffco";
import { isElectron } from "../utils/electron";
import { DesktopBleConnectModal } from "../components/modals/DesktopBluetoothConnect";
import { DeviceLogsModal } from "../components/modals/DeviceLogs";

export const instance = new Device();
if (typeof window != "undefined") window["instance"] = instance;

export default function Group({
  group: initGrp,
  headless,
}: {
  group: APIGroup;
  headless: boolean;
}) {
  const router = useRouter();
  const [initGroup] = useState(initGrp);

  const membersList = useRef<HTMLDivElement>();

  const { connectDismissed, group } = useSelector(selectGroupState);
  const dispatch = useDispatch();

  const [deviceConnected, setDeviceConnected] = useState(false);
  const [groupJoinErrorMessage, setGroupJoinErrorMessage] = useState<string>();

  const [chatBoxOpen, setChatBoxOpen] = useState(false);

  const [ourLeaderboardPosition, setOurLeaderboardPosition] =
    useState<number>(0);
  const [usAway, setUsAway] = useState(false);
  const [ourStrain, setOurStrain] = useState<string>();
  const [ourUser, setOurUser] = useState<User>();
  const [usDisconnected, setUsDisconnected] = useState<boolean>(false);

  const [connecting, setConnecting] = useState(false);

  const [deviceProfiles, setDeviceProfiles] = useState<
    Record<number, PuffcoProfile>
  >({});
  const [deviceInfo, setDeviceInfo] = useState<DeviceInformation>();
  const [myDevice, setMyDevice] = useState<DeviceState>();

  const [connectingDevice, setConnectingDevice] = useState<BluetoothDevice>();

  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [groupMembersModalOpen, setGroupMembersModalOpen] = useState(false);
  const [userSettingsModalOpen, setUserSettingsModalOpen] = useState(false);
  const [strainSetModalOpen, setStrainSetModalOpen] = useState(false);
  const [deviceSettingsModalOpen, setDeviceSettingsModalOpen] = useState(false);
  const [deviceLogsModalOpen, setDeviceLogsModalOpen] = useState(false);
  const [groupSettingsModalOpen, setGroupSettingsModalOpen] = useState(false);

  const [firstVisit] = useState(() =>
    typeof localStorage != "undefined"
      ? localStorage.getItem("puff-social-first-visit") != "false"
      : false
  );

  const deletedGroup = useCallback(() => {
    if (group.owner_session_id != gateway.session_id)
      toast("The group you were in was deleted", {
        position: "top-right",
        duration: 5000,
        icon: "🗑",
      });
    if (!headless) router.push("/");
    else router.reload();
  }, [group, headless]);

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
  }, [group]);

  function groupMemberDeviceUpdated({ device_state }: GroupUserDeviceUpdate) {
    if (!device_state) return;
  }

  function groupMemberJoin(member: GroupUserJoin) {
    toast(`${member.user?.display_name || "Guest"} joined`, {
      position: "top-right",
    });
  }

  function groupMemberLeft({ session_id }: GroupUserLeft) {
    const member = group.members.find((mem) => mem.session_id == session_id);
    if (member)
      toast(
        `${
          member.user?.display_name ||
          member.device_state?.deviceName ||
          "Guest"
        } left`,
        {
          position: "top-right",
        }
      );
  }

  function groupUserKicked() {
    toast(`You were kicked from this group`, {
      position: "top-right",
      icon: <Kick />,
    });
    if (!headless) router.push("/");
    else router.reload();
  }

  const groupReaction = useCallback(
    async ({ emoji, author_session_id }: GroupReaction) => {
      const member = group.members.find(
        (mem) => mem.session_id == author_session_id
      );
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
            gravity: -0.25,
            framerate: 40,
            opacityDecay: 22,
            fontSize: {
              min: 15,
              max: 45,
            },
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
          emojiCount: 5,
          physics: {
            gravity: -0.45,
            framerate: 40,
            opacityDecay: 22,
            fontSize: {
              min: 10,
              max: 25,
            },
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

        toast(
          `${
            member.user?.display_name ||
            member.device_state?.deviceName ||
            "Guest"
          }: ${emoji}`,
          {
            position: "top-right",
            duration: 1000,
          }
        );
      }
    },
    [group?.members, deviceConnected]
  );

  async function startDab(data: GroupHeatBegin) {
    toast("3...", { duration: 1000, position: "top-right" });
    setTimeout(() => {
      toast("2...", { duration: 1000, position: "top-right" });
      setTimeout(() => {
        toast("1...", { duration: 900, position: "top-right" });
        toast("Dab", { duration: 1000, position: "top-right" });

        const start = async () =>
          instance.sendCommand(DeviceCommand.HEAT_CYCLE_BEGIN).catch(start);

        if (!data.away && !data.watcher && !data.excluded) start();
      }, 1000);
    }, 1000);
  }

  const inquireDab = useCallback(
    (data: GroupHeatInquire) => {
      const initiator = group.members.find(
        (mem) => mem.session_id == data.session_id
      );
      toast(
        `${
          initiator.user?.name || initiator.device_state?.deviceName || "Guest"
        } wants to start`,
        {
          icon: "🔥",
          duration: 5000,
          position: "top-right",
        }
      );

      if (!data.away && !data.watcher && !data.excluded) {
        (async () => {
          await instance.sendCommand(DeviceCommand.BONDING);
          await instance.setLightMode(PuffLightMode.QueryReady);
        })();

        toast(`Confirm by pressing your button`, {
          icon: "🔘",
          duration: 8000,
          position: "top-right",
        });
      }
    },
    [group?.members]
  );

  const groupMemberReady = useCallback(
    (data: GroupActionInitiator) => {
      const initiator = group.members.find(
        (mem) => mem.session_id == data.session_id
      );

      toast(
        `${
          initiator.user?.name || initiator.device_state?.deviceName || "Guest"
        } is ready`,
        {
          icon: "✅",
          duration: 5000,
          position: "top-right",
        }
      );
    },
    [group?.members]
  );

  const groupMemberUnready = useCallback(
    (data: GroupActionInitiator) => {
      const initiator = group.members.find(
        (mem) => mem.session_id == data.session_id
      );

      if (initiator)
        toast(
          `${
            initiator.user?.name ||
            initiator.device_state?.deviceName ||
            "Guest"
          } is no longer ready`,
          {
            icon: "🚫",
            duration: 5000,
            position: "top-right",
          }
        );
    },
    [group?.members]
  );

  function groupJoinError(error: GatewayError) {
    switch (error.code) {
      case "INVALID_GROUP_ID": {
        dispatch(
          setGroupState({ joinErrorMessage: "Unknown or invalid group ID" })
        );
        break;
      }
    }
  }

  const groupChangeVisibility = useCallback(
    (data: GroupActionInitiator & { visibility: string }) => {
      const initiator = group.members.find(
        (mem) => mem.session_id == data.session_id
      );

      toast(
        `${
          data.session_id == gateway.session_id
            ? ourUser?.name
            : initiator.user?.name ||
              initiator.device_state?.deviceName ||
              "Guest"
        } made the group ${data.visibility}`,
        {
          icon: data.visibility == "public" ? "🌍" : "🔒",
          duration: 5000,
          position: "top-right",
        }
      );
    },
    [group?.members]
  );

  const disconnect = useCallback(async () => {
    if (deviceConnected) await instance.setLightMode(PuffLightMode.Default);
    instance.disconnect();
    setDeviceConnected(false);
    setMyDevice(null);
    gateway.send(Op.DisconnectDevice);
  }, [deviceConnected]);

  function gatewayClosed() {
    setUsDisconnected(true);
    toast("Socket disconnected (Reconnecting..)", {
      position: "top-right",
      duration: 1000,
      icon: <PlugDisconnected />,
    });
  }

  useEffect(() => {
    gateway.on("group_heat_inquiry", inquireDab);
    return () => {
      gateway.removeListener("group_heat_inquiry", inquireDab);
    };
  }, [group?.members]);

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
      gateway.on("group_join_error", groupJoinError);
      gateway.on("group_user_device_update", groupMemberDeviceUpdated);
      gateway.on("group_heat_begin", startDab);

      gateway.on("group_visibility_change", groupChangeVisibility);

      gateway.on("group_user_ready", groupMemberReady);
      gateway.on("group_user_unready", groupMemberUnready);
      gateway.on("group_user_join", groupMemberJoin);
      gateway.on("group_user_left", groupMemberLeft);
      gateway.on("group_user_kicked", groupUserKicked);

      gateway.on("close", gatewayClosed);

      if (gateway.ws.readyState == gateway.ws.OPEN)
        gateway.send(Op.Join, { group_id: initGroup.group_id });
      else
        gateway.once("init", () => {
          gateway.send(Op.Join, { group_id: initGroup.group_id });
        });

      return () => {
        gateway.send(Op.LeaveGroup);
        disconnect();
        gateway.removeListener("group_join_error", groupJoinError);

        gateway.removeListener(
          "group_user_device_update",
          groupMemberDeviceUpdated
        );

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

        gateway.removeListener("close", gatewayClosed);
      };
    }
  }, [initGroup]);

  useEffect(() => {
    gateway.on("session_resumed", sessionResumed);
    return () => {
      gateway.removeListener("session_resumed", sessionResumed);
    };
  }, [sessionResumed]);

  useEffect(() => {}, [chatBoxOpen]);

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
      instance.on("device_connected", (device) => {
        setConnectingDevice(device);
      });

      setConnecting(true);
      instance.on("profiles", (profiles) => {
        setDeviceProfiles(profiles);
      });
      await instance.init();

      const { poller, initState, deviceInfo } = await instance.startPolling();
      try {
        const tracked = await trackDevice({
          ...deviceInfo,
          ...(initState.lastDab
            ? { lastDabAt: new Date(initState.lastDab.timestamp).toISOString() }
            : {}),
        });
        setOurLeaderboardPosition(tracked.data.position);
      } catch (error) {}

      instance.once("gattdisconnect", async () => {
        instance.removeAllListeners("reconnecting");
        instance.removeAllListeners("reconnected");
        setDeviceConnected(false);

        poller.emit("stop", false);
        gateway.send(Op.DisconnectDevice);

        toast(`Disconnected from ${deviceInfo.name}`, {
          icon: <BluetoothDisabled />,
          position: "top-right",
        });
      });

      instance.on("reconnecting", () => {
        toast(`Reconnecting to ${deviceInfo.name}`, {
          icon: (
            <PuffcoLogo
              style={{
                color:
                  DeviceModelColors[ProductModelMap[deviceInfo.model || "0"]],
              }}
            />
          ),
          position: "top-right",
          duration: 1000,
        });
      });

      instance.on("reconnected", () => {
        toast(`Reconnected to ${deviceInfo.name}`, {
          icon: (
            <PuffcoLogo
              style={{
                color:
                  DeviceModelColors[ProductModelMap[deviceInfo.model || "0"]],
              }}
            />
          ),
          position: "top-right",
          duration: 1000,
        });
      });

      toast(`Connected to ${deviceInfo.name}`, {
        icon: (
          <PuffcoLogo
            style={{
              color:
                DeviceModelColors[ProductModelMap[deviceInfo.model || "0"]],
            }}
          />
        ),
        position: "top-right",
      });

      setDeviceInfo(deviceInfo as DeviceInformation);
      setMyDevice((curr) => ({ ...curr, ...initState }));
      gateway.send(Op.SendDeviceState, initState);

      setConnecting(false);
      setDeviceConnected(true);
      setConnectingDevice(null);

      dispatch(
        updateGroupMemberDevice({
          group_id: group.id,
          session_id: gateway.session_id,
          device_state: initState as DeviceState,
        })
      );

      poller.on("data", async (data) => {
        if (data.totalDabs)
          setDeviceInfo((deviceInfo) => {
            trackDevice({ ...deviceInfo, totalDabs: data.totalDabs });
            return deviceInfo;
          });

        if (data.lastDab)
          setDeviceInfo((deviceInfo) => {
            trackDevice({
              ...deviceInfo,
              lastDabAt: new Date(data.lastDab.timestamp).toISOString(),
            });
            return deviceInfo;
          });

        dispatch(
          updateGroupMemberDevice({
            group_id: group.id,
            session_id: gateway.session_id,
            device_state: data,
          })
        );

        setMyDevice((curr) => ({ ...curr, ...data }));

        gateway.send(Op.SendDeviceState, data);
      });
    } catch (error) {
      setConnecting(false);

      if (
        error &&
        error.toString().endsWith("User cancelled the requestDevice() chooser.")
      ) {
        toast("User canceled bluetooth connection request.", {
          position: "top-right",
          duration: 1200,
          icon: "❌",
        });

        return;
      }

      toast("Failed to connect to your device.", {
        position: "top-right",
        duration: 5000,
        icon: "‼",
      });

      console.error(error);
    }
  }, [group]);

  function closeChatBox(event: KeyboardEvent) {
    return event.code == "Escape" ? setChatBoxOpen(false) : false;
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
    <div
      className={`flex flex-col ${!headless ? "justify-between" : ""} h-screen`}
    >
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
        <>
          <DeviceSettingsModal
            instance={instance}
            device={myDevice}
            info={deviceInfo}
            setDeviceInfo={setDeviceInfo}
            setMyDevice={setMyDevice}
            modalOpen={deviceSettingsModalOpen}
            setModalOpen={setDeviceSettingsModalOpen}
          />
          <DeviceLogsModal
            instance={instance}
            modalOpen={deviceLogsModalOpen}
            setModalOpen={setDeviceLogsModalOpen}
          />
        </>
      ) : (
        <></>
      )}

      {group && group.members ? (
        <GroupMembersModal
          modalOpen={groupMembersModalOpen}
          setModalOpen={setGroupMembersModalOpen}
          group={group}
          members={group.members}
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

      {group ? (
        <NoSSR>
          {!headless ? (
            <div className="flex flex-col m-4 z-10">
              {group ? (
                <>
                  <GroupHeader
                    group={group}
                    setGroupMembersModalOpen={setGroupMembersModalOpen}
                  />

                  <GroupActions
                    group={group}
                    members={group.members}
                    instance={instance}
                    deviceConnected={deviceConnected}
                    deviceProfiles={deviceProfiles}
                    disconnect={disconnect}
                    setGroupSettingsModalOpen={setGroupSettingsModalOpen}
                    setDeviceSettingsModalOpen={setDeviceSettingsModalOpen}
                    setDeviceLogsModalOpen={setDeviceLogsModalOpen}
                    setUserSettingsModalOpen={setUserSettingsModalOpen}
                    setFeedbackModalOpen={setFeedbackModalOpen}
                    setLeaderboardOpen={setLeaderboardOpen}
                    connectDismissed={connectDismissed}
                    connectToDevice={connectToDevice}
                  />
                </>
              ) : (
                <></>
              )}
            </div>
          ) : (
            <div className="flex flex-col m-4 z-10">
              <h1 className="flex flex-row text-4xl text-black dark:text-white font-bold items-center">
                puff.social
              </h1>
            </div>
          )}

          {isElectron() ? <DesktopBleConnectModal /> : <></>}

          <div className="flex flex-row flex-wrap m-4" ref={membersList}>
            <>
              <GroupMember
                connectingDevice={connectingDevice}
                device={myDevice}
                strain={ourStrain}
                leaderboardPosition={ourLeaderboardPosition}
                ready={group.ready.includes(gateway.session_id)}
                connectToDevice={connectToDevice}
                connected={deviceConnected}
                nobody={
                  group.members.filter((mem) => validState(mem.device_state))
                    .length == 0
                }
                owner={group.owner_session_id == gateway.session_id}
                setStrainModalOpen={setStrainSetModalOpen}
                group={group}
                away={usAway}
                user={ourUser}
                instance={instance}
                member={group.members.find(
                  (mem) => mem.session_id == gateway.session_id
                )}
                connecting={connecting}
                disconnected={usDisconnected}
                headless={headless}
                us
                setConnectDismissed={(val: boolean) =>
                  dispatch(setGroupState({ connectDismissed: val }))
                }
                connectDismissed={connectDismissed}
              />
              {group.members
                .filter(
                  (mem) =>
                    validState(mem.device_state) &&
                    gateway.session_id != mem.session_id
                )
                .map((member) => (
                  <GroupMember
                    device={member.device_state}
                    ready={group.ready.includes(member.session_id)}
                    member={member}
                    group={group}
                    headless={headless}
                    key={member.session_id}
                    setConnectDismissed={(val: boolean) =>
                      dispatch(setGroupState({ connectDismissed: val }))
                    }
                    connectDismissed={connectDismissed}
                  />
                ))}
              {group.members.filter((mem) => validState(mem.device_state))
                .length == 1 ? (
                <GroupMember
                  nobodyelse
                  headless={headless}
                  connectDismissed={connectDismissed}
                />
              ) : (
                <></>
              )}
            </>
          </div>

          {/* {!headless ? (
            <div className="absolute right-0 bottom-0 m-4">
              <Tippy
                interactive
                placement="left-start"
                content={
                  <ChatBox
                    chatBoxOpen={chatBoxOpen}
                    group={group}
                    user={ourUser}
                    members={group.members}
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
          )} */}

          <div />
        </NoSSR>
      ) : (
        <>
          <div />
          <div className="flex flex-col justify-center items-center text-center text-black dark:text-white">
            <h2 className="text-xl m-4">
              {groupJoinErrorMessage
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
