import { Dispatch, SetStateAction, useRef, useState } from "react";

import { Bluetooth, BluetoothDisabled } from "./icons/Bluetooth";
import { Edit } from "./icons/Edit";
import { Info } from "./icons/Info";
import { LeaderboardIcon } from "./icons/LeaderboardIcon";
import { Mail } from "./icons/Mail";
import { Settings } from "./icons/Settings";
import { Smoke } from "./icons/Smoke";
import { Stop } from "./icons/Stop";
import { GatewayGroup, GatewayGroupMember, GroupState } from "../types/gateway";
import { gateway } from "../utils/gateway";
import { Reaction } from "./icons/Reaction";
import { Tippy } from "./Tippy";
import { Leave } from "./icons/Leave";
import { Skip } from "./icons/Skip";
import { useRouter } from "next/router";
import { ArrowSwitch } from "./icons/ArrowSwitch";
import { PuffcoProfile } from "../types/puffco";
import toast from "react-hot-toast";
import { GiftBox } from "./icons/GiftBox";
import { DeviceSettings } from "./icons/DeviceSettings";
import { Discord } from "./icons/Discord";
import { useSelector } from "react-redux";
import { selectSessionState, setSessionState } from "../state/slices/session";
import { Device } from "../utils/puffco";
import { Instagram } from "./icons/Instagram";
import { LoginModal } from "./modals/Login";
import { Account } from "./icons/Account";
import { AccountSettingsModal } from "./modals/AccountSettings";
import { InfoModal } from "./modals/Info";
import { Hamburger } from "./icons/Hamburger";
import { PuffcoLogo } from "./icons/Puffco";
import {
  ChamberType,
  DeviceModelColors,
  ProductModelMap,
} from "@puff-social/commons/dist/puffco/constants";
import { Op, UserFlags } from "@puff-social/commons";
import { DonationModal } from "./modals/Donation";
import { validState } from "@puff-social/commons/dist/puffco";
import { IntensityIcon } from "./IntensityIcon";
import {
  dismissBadge,
  selectUIState,
  setEditingProfile,
  setEditingProfileIndex,
  setProfileModalOpen,
} from "../state/slices/ui";
import { ProfileEditModal } from "./modals/ProfileEdit";
import { Logs } from "./icons/Logs";
import { useAppDispatch } from "../state/store";

interface ActionsProps {
  group?: GatewayGroup;
  members?: GatewayGroupMember[];
  instance?: Device;
  readyMembers?: string[];
  deviceConnected?: boolean;
  connectDismissed?: boolean;
  deviceProfiles?: Record<number, PuffcoProfile>;
  disconnect?: Function;
  connectToDevice?: Function;
  setGroupSettingsModalOpen?: Dispatch<SetStateAction<boolean>>;
  setDeviceSettingsModalOpen?: Dispatch<SetStateAction<boolean>>;
  setDeviceLogsModalOpen?: Dispatch<SetStateAction<boolean>>;
  setUserSettingsModalOpen: Dispatch<SetStateAction<boolean>>;
  setFeedbackModalOpen: Dispatch<SetStateAction<boolean>>;
  setLeaderboardOpen: Dispatch<SetStateAction<boolean>>;
}

export function GroupActions({
  group,
  members,
  instance,
  setGroupSettingsModalOpen,
  setDeviceSettingsModalOpen,
  setDeviceLogsModalOpen,
  setUserSettingsModalOpen,
  deviceConnected,
  connectDismissed,
  deviceProfiles,
  disconnect,
  connectToDevice,
  setFeedbackModalOpen,
  setLeaderboardOpen,
}: ActionsProps) {
  const reactionButton = useRef<HTMLDivElement>();

  const ui = useSelector(selectUIState);
  const session = useSelector(selectSessionState);
  const dispatch = useAppDispatch();

  const router = useRouter();

  const [loginOpen, setLoginOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [donationsOpen, setDonationsOpen] = useState(false);
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);

  const [bluetooth] = useState<boolean>(() => {
    if (typeof window == "undefined") return false;
    return typeof window.navigator.bluetooth !== "undefined";
  });

  async function logoutUser() {
    localStorage.removeItem("puff-social-auth");
    toast("Logged out", {
      position: "top-right",
      duration: 2000,
      icon: <Leave />,
    });
    dispatch(setSessionState({ user: null, connection: null }));
  }

  return (
    <div
      className="flex flex-row drop-shadow-xl rounded-md py-2 flex-wrap"
      ref={reactionButton}
    >
      {session.user ? (
        <>
          <AccountSettingsModal
            modalOpen={accountSettingsOpen}
            setModalOpen={setAccountSettingsOpen}
          />
        </>
      ) : (
        <>
          <LoginModal modalOpen={loginOpen} setModalOpen={setLoginOpen} />
        </>
      )}
      <InfoModal modalOpen={infoOpen} setModalOpen={setInfoOpen} />
      <DonationModal
        modalOpen={donationsOpen}
        setModalOpen={setDonationsOpen}
      />

      {group ? (
        <>
          {!deviceConnected && connectDismissed && bluetooth ? (
            <Tippy content="Connect Device" placement="bottom">
              <div
                className="flex items-center rounded-md p-1 bg-white dark:bg-neutral-800 cursor-pointer h-fit m-1 drop-shadow-xl"
                onClick={() => connectToDevice(true)}
              >
                <Bluetooth />
              </div>
            </Tippy>
          ) : (
            <></>
          )}
          <span className="pr-3 flex flex-row">
            {group.state == GroupState.Chilling ? (
              group.members.filter((mem) => validState(mem.device_state))
                .length > 0 &&
              members.filter(
                (mem) =>
                  mem.away &&
                  typeof mem.device_state == "object" &&
                  Object.keys(mem.device_state || {}).length > 0
              ).length !=
                group.members.filter((mem) => validState(mem.device_state))
                  .length ? (
                <Tippy content="Start a group sesh" placement="bottom">
                  <div
                    className="flex items-center rounded-md p-1 bg-white dark:bg-neutral-800 cursor-pointer h-fit m-1 drop-shadow-xl text-green-500 dark:text-green-200"
                    onClick={() => gateway.send(Op.InquireHeating)}
                  >
                    <Smoke />
                  </div>
                </Tippy>
              ) : (
                <></>
              )
            ) : group.state == GroupState.Awaiting ? (
              <>
                {group.ready.length > 0 ? (
                  <Tippy content="Start anyway" placement="bottom">
                    <div
                      className="flex items-center rounded-md p-1 bg-white dark:bg-neutral-800 cursor-pointer h-fit m-1 drop-shadow-xl text-green-400"
                      onClick={() => gateway.send(Op.StartWithReady)}
                    >
                      <Skip />
                    </div>
                  </Tippy>
                ) : (
                  <></>
                )}
                <Tippy content="Stop" placement="bottom">
                  <div
                    className="flex items-center rounded-md p-1 bg-white dark:bg-neutral-800 cursor-pointer h-fit m-1 drop-shadow-xl text-red-400"
                    onClick={() => gateway.send(Op.StopAwaiting)}
                  >
                    <Stop />
                  </div>
                </Tippy>
              </>
            ) : (
              <></>
            )}
            {gateway.session_id == group.owner_session_id ||
            session.user?.flags & UserFlags.admin ? (
              <Tippy content="Edit Group" placement="bottom">
                <div
                  className="flex items-center rounded-md p-1 bg-white dark:bg-neutral-800 cursor-pointer h-fit m-1 drop-shadow-xl"
                  onClick={() => setGroupSettingsModalOpen(true)}
                >
                  <Edit />
                </div>
              </Tippy>
            ) : (
              <></>
            )}
            {deviceConnected ? (
              <>
                <ProfileEditModal instance={instance} />
                <Tippy
                  arrow={false}
                  interactive
                  content={
                    <span className="flex flex-col text-black bg-white dark:text-white dark:bg-neutral-900 drop-shadow-xl rounded-md space-y-2 p-2 w-72">
                      <Tippy
                        trigger="click"
                        interactive
                        onShown={() => {
                          if (
                            !ui.dismissedBadges.includes("deviceProfileEditor")
                          )
                            dispatch(dismissBadge("deviceProfileEditor"));
                        }}
                        content={
                          <div className="flex flex-col text-black bg-white dark:text-white dark:bg-neutral-900 drop-shadow-xl rounded-md p-2 w-96">
                            <p className="text-lg font-bold">Profiles</p>
                            <span className="flex flex-col flex-wrap">
                              {Object.keys(deviceProfiles).map((key) => (
                                <div className="group" key={key}>
                                  <div
                                    className="hidden group-hover:flex rounded-full p-2 w-8 h-8 justify-center items-center bg-black dark:bg-white text-white opacity-50 group-hover:opacity-100 cursor-pointer dark:text-black fixed z-10 right-0"
                                    onClick={() => {
                                      dispatch(
                                        setEditingProfileIndex(Number(key))
                                      );
                                      dispatch(
                                        setEditingProfile(deviceProfiles[key])
                                      );
                                      dispatch(setProfileModalOpen(true));
                                    }}
                                  >
                                    <Edit />
                                  </div>
                                  <div
                                    key={key}
                                    className="select-none group text-lg flex justify-between rounded-md bg-white dark:bg-stone-800 drop-shadow-lg p-1 m-1 cursor-pointer hover:bg-gray-300 dark:hover:bg-stone-900"
                                    onClick={async () => {
                                      await instance.switchProfile(Number(key));
                                      toast(
                                        `Switched device profile to ${deviceProfiles[key].name}`
                                      );
                                    }}
                                  >
                                    <span className="flex flex-col">
                                      <span className="flex flex-row items-center space-x-2">
                                        <p className="text-lg">
                                          {deviceProfiles[key].name}
                                        </p>
                                        <div
                                          className="w-4 h-4 rounded-full"
                                          style={{
                                            backgroundColor:
                                              deviceProfiles[key].color,
                                          }}
                                        />
                                      </span>
                                      <p className="text-2xl font-bold">
                                        {Math.floor(
                                          deviceProfiles[key].temp * 1.8 + 32
                                        )}
                                        °
                                      </p>
                                    </span>
                                    <div className="flex flex-col justify-end items-end">
                                      <div className="flex flex-col">
                                        {[
                                          ChamberType["3D"],
                                          ChamberType.XL,
                                        ].includes(instance.chamberType) &&
                                        deviceProfiles[key] ? (
                                          <div className="flex flex-row space-x-2">
                                            <IntensityIcon
                                              intensity={
                                                deviceProfiles[key].intensity
                                              }
                                            />
                                            <span className="flex mt-2 px-1 rounded-lg bg-black text-white items-center justify-center w-fit">
                                              <p className="text-sm px-1">
                                                {deviceProfiles[key].time}
                                              </p>
                                            </span>
                                          </div>
                                        ) : (
                                          <span className="flex mt-2 px-1 rounded-lg bg-black text-white items-center justify-center w-fit">
                                            <p className="text-sm px-1">
                                              {deviceProfiles[key].time}
                                            </p>
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </span>
                          </div>
                        }
                      >
                        <span className="flex p-2 rounded-md text-black dark:text-white bg-stone-100 hover:bg-stone-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 cursor-pointer items-center justify-between">
                          {!ui.dismissedBadges.includes(
                            "deviceProfileEditor"
                          ) ? (
                            <div className="absolute top-0 -right-4 -m-1 bg-red-600 rounded-full px-1">
                              New
                            </div>
                          ) : (
                            <></>
                          )}
                          <p>Switch Profile</p>
                          <ArrowSwitch />
                        </span>
                      </Tippy>
                      <span
                        className="flex p-2 relative rounded-md text-black dark:text-white bg-stone-100 hover:bg-stone-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 cursor-pointer items-center justify-between"
                        onClick={() => setDeviceLogsModalOpen(true)}
                      >
                        {!ui.dismissedBadges.includes("deviceLogDisplay") ? (
                          <div className="absolute top-0 -right-4 -m-1 bg-red-600 rounded-full px-1">
                            New
                          </div>
                        ) : (
                          <></>
                        )}
                        <p>Device Logs</p>
                        <Logs />
                      </span>
                      <span
                        className="flex p-2 rounded-md text-black dark:text-white bg-stone-100 hover:bg-stone-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 cursor-pointer items-center justify-between"
                        onClick={() => setDeviceSettingsModalOpen(true)}
                      >
                        <p>Device Settings</p>
                        <DeviceSettings />
                      </span>
                      <span
                        className="flex p-2 rounded-md text-red-400 dark:text-red-400 bg-stone-100 hover:bg-stone-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 cursor-pointer items-center justify-between"
                        onClick={() => disconnect()}
                      >
                        <p>Disconnect</p>
                        <BluetoothDisabled />
                      </span>
                    </span>
                  }
                  placement="bottom-start"
                >
                  <div className="flex items-center rounded-md p-1 bg-white dark:bg-neutral-800 cursor-pointer h-fit m-1 drop-shadow-xl">
                    {!ui.dismissedBadges.includes("deviceLogDisplay") ||
                    !ui.dismissedBadges.includes("deviceProfileEditor") ? (
                      <span className="absolute top-0 right-0 -m-1 bg-red-600 rounded-full w-3 h-3" />
                    ) : (
                      <></>
                    )}
                    <PuffcoLogo
                      style={{
                        color:
                          DeviceModelColors[
                            ProductModelMap[instance.deviceModel || "0"]
                          ],
                      }}
                    />
                  </div>
                </Tippy>
              </>
            ) : (
              <></>
            )}
            <Tippy content="Leave Group" placement="bottom">
              <div
                className="flex items-center rounded-md p-1 bg-white dark:bg-neutral-800 cursor-pointer h-fit m-1 drop-shadow-xl text-red-400"
                onClick={() => router.push("/")}
              >
                <Leave />
              </div>
            </Tippy>
            <Tippy content="Group Reactions" placement="bottom">
              <div>
                <Tippy
                  arrow={false}
                  content={
                    <div className="flex flex-col text-black bg-white dark:text-white dark:bg-neutral-900 drop-shadow-xl rounded-md p-2 w-72">
                      <p className="text-lg font-bold">Reactions</p>
                      <span className="flex flex-wrap">
                        {[
                          "👍",
                          "✌️",
                          "👋",
                          "🤙",
                          "😂",
                          "😮‍💨",

                          "🤬",
                          "🤯",
                          "🫠",
                          "🫡",
                          "💨",
                          "🚬",

                          "🗡️",
                          "🕐",
                          "⏭️",
                          "⏳",
                          "🎙️",
                          "🔥",

                          "🪫",
                          "✅",
                          "🍯",
                          "🍕",
                          "🍻",
                          "🍄",

                          "🪦",
                          "💀",
                          "😵",
                          "🌬️",
                          "🌡️",
                          "💣",
                        ].map((emoji) => (
                          <span
                            key={emoji}
                            className="w-9 select-none text-lg flex justify-center items-center rounded-md bg-white dark:bg-stone-800 drop-shadow-lg p-1 m-1 cursor-pointer hover:bg-gray-300 dark:hover:bg-stone-900"
                            onClick={() => {
                              gateway.send(Op.SendReaction, { emoji });
                            }}
                          >
                            {emoji}
                          </span>
                        ))}
                      </span>
                    </div>
                  }
                  interactive
                  zIndex={50000}
                  placement="bottom-start"
                  trigger="click"
                >
                  <div className="flex items-center rounded-md p-1 bg-white dark:bg-neutral-800 cursor-pointer h-fit m-1 drop-shadow-xl">
                    <Reaction />
                  </div>
                </Tippy>
              </div>
            </Tippy>
          </span>
        </>
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
      <Tippy content="Dab Leaderboard" placement="bottom">
        <div
          className="flex items-center rounded-md p-1 bg-white dark:bg-neutral-800 cursor-pointer h-fit m-1 drop-shadow-xl"
          onClick={() => setLeaderboardOpen(true)}
        >
          <LeaderboardIcon />
        </div>
      </Tippy>
      <Tippy
        arrow={false}
        interactive
        content={
          <span className="flex flex-col text-black bg-white dark:text-white dark:bg-neutral-900 drop-shadow-xl rounded-md space-y-2 p-2 w-72">
            <span
              className="flex p-2 rounded-md text-black dark:text-white bg-stone-100 hover:bg-stone-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 cursor-pointer items-center justify-between"
              onClick={() => setInfoOpen(true)}
            >
              <p>About</p>
              <Info />
            </span>
            <span
              className="flex p-2 rounded-md text-black dark:text-white bg-stone-100 hover:bg-stone-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 cursor-pointer items-center justify-between"
              onClick={() => setDonationsOpen(true)}
            >
              <p>Support Development</p>
              <GiftBox />
            </span>
            <span
              className="flex p-2 rounded-md text-black dark:text-white bg-stone-100 hover:bg-stone-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 cursor-pointer items-center justify-between"
              onClick={() => setFeedbackModalOpen(true)}
            >
              <p>Submit Feedback</p>
              <Mail />
            </span>
            <span
              className="flex p-2 rounded-md text-black dark:text-white bg-stone-100 hover:bg-stone-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 cursor-pointer items-center justify-between"
              onClick={() => window.open("/instagram")}
            >
              <p>Instagram</p>
              <Instagram />
            </span>
            <span
              className="flex p-2 rounded-md text-black dark:text-white bg-stone-100 hover:bg-stone-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 cursor-pointer items-center justify-between"
              onClick={() => window.open("/discord")}
            >
              <p>Discord</p>
              <Discord />
            </span>
          </span>
        }
        placement="bottom-start"
      >
        <div className="flex items-center rounded-md p-1 bg-white dark:bg-neutral-800 cursor-pointer h-fit m-1 drop-shadow-xl">
          <Hamburger />
        </div>
      </Tippy>
      <span className="pl-3 flex flex-row">
        <Tippy
          arrow={false}
          interactive
          content={
            session.user ? (
              <span className="flex flex-col text-black bg-white dark:text-white dark:bg-neutral-900 drop-shadow-xl rounded-md space-y-2 p-2 w-72">
                <span
                  className="flex p-2 rounded-md text-black dark:text-white bg-stone-100 hover:bg-stone-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 cursor-pointer items-center justify-between"
                  onClick={() => setAccountSettingsOpen(true)}
                >
                  <p>Account Settings</p>
                  <Settings />
                </span>
                <span
                  className="flex p-2 rounded-md text-black dark:text-white bg-stone-100 hover:bg-stone-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 cursor-pointer items-center justify-between"
                  onClick={() => logoutUser()}
                >
                  <p>Logout</p>
                  <Leave className="text-red-400" />
                </span>
              </span>
            ) : (
              <></>
            )
          }
          placement="bottom-start"
        >
          <div
            className="flex items-center justify-center group rounded-md p-1 bg-white dark:bg-neutral-800 cursor-pointer h-fit m-1 drop-shadow-xl"
            onClick={() => (!session.user ? setLoginOpen(true) : false)}
          >
            {session.user && session.user.image ? (
              <>
                <img
                  className="rounded-full p-0.5 w-7 h-7"
                  src={`https://cdn.puff.social/avatars/${session.user.id}/${
                    session.user.image
                  }.${session.user.image.startsWith("a_") ? "gif" : "png"}`}
                />
                <p className="mx-1 text-sm opacity-50 group-hover:opacity-100 transition-all">
                  {session.user.display_name}
                </p>
              </>
            ) : session.user ? (
              <>
                <Account />
                <p className="mx-1 text-sm opacity-50 group-hover:opacity-100 transition-all">
                  {session.user.display_name}
                </p>
              </>
            ) : (
              <>
                <Account />
                <p className="mx-1 text-sm opacity-50 group-hover:opacity-100 transition-all">
                  Login
                </p>
              </>
            )}
          </div>
        </Tippy>
      </span>
    </div>
  );
}
