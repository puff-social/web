import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { BluetoothDisabled } from "./icons/Bluetooth";
import { Edit } from "./icons/Edit";
import { Info } from "./icons/Info";
import { LeaderboardIcon } from "./icons/LeaderboardIcon";
import { Mail } from "./icons/Mail";
import { Settings } from "./icons/Settings";
import { Smoke } from "./icons/Smoke";
import { Stop } from "./icons/Stop";
import { GatewayGroup, GatewayGroupMember, GroupState } from "../types/gateway";
import { Op, gateway } from "../utils/gateway";
import { Reaction } from "./icons/Reaction";
import { Tippy } from "./Tippy";
import { Leave } from "./icons/Leave";
import { Skip } from "./icons/Skip";
import { useRouter } from "next/router";
import { ArrowSwitch } from "./icons/ArrowSwitch";
import { switchProfile } from "../utils/puffco";
import { PuffcoProfile } from "../types/puffco";
import toast from "react-hot-toast";
import { GiftBox } from "./icons/GiftBox";
import { DeviceSettings } from "./icons/DeviceSettings";
import { Account } from "./icons/Account";
import { Discord } from "./icons/Discord";
import { callbackDiscordOAuth, getDiscordOAuth } from "../utils/hash";
import { useDispatch, useSelector } from "react-redux";
import { selectSessionState, setSessionState } from "../state/slices/session";

interface ActionsProps {
  group?: GatewayGroup;
  seshers?: number;
  members?: GatewayGroupMember[];
  readyMembers?: string[];
  deviceConnected?: boolean;
  deviceProfiles?: Record<number, PuffcoProfile>;
  disconnect?: Function;
  setGroupSettingsModalOpen?: Dispatch<SetStateAction<boolean>>;
  setDeviceSettingsModalOpen?: Dispatch<SetStateAction<boolean>>;
  setUserSettingsModalOpen: Dispatch<SetStateAction<boolean>>;
  setFeedbackModalOpen: Dispatch<SetStateAction<boolean>>;
  setLeaderboardOpen: Dispatch<SetStateAction<boolean>>;
}

export function GroupActions({
  group,
  seshers,
  members,
  readyMembers,
  setGroupSettingsModalOpen,
  setDeviceSettingsModalOpen,
  setUserSettingsModalOpen,
  deviceConnected,
  deviceProfiles,
  disconnect,
  setFeedbackModalOpen,
  setLeaderboardOpen,
}: ActionsProps) {
  const reactionButton = useRef<HTMLDivElement>();

  const session = useSelector(selectSessionState);
  const dispatch = useDispatch();

  const router = useRouter();

  const startDiscordOAuth = useCallback(async () => {
    const oauth = await getDiscordOAuth();
    const child = window.open(
      oauth.data.url,
      "Login with Discord",
      "width=480,height=820"
    );

    const int = setInterval(async () => {
      try {
        const search = new URLSearchParams(child.location.search);

        if (child.closed) {
          toast("Login canceled", {
            position: "top-right",
            duration: 2000,
            icon: "❌",
          });
          clearInterval(int);
        }

        if (search.get("code")) {
          const authed = await callbackDiscordOAuth(
            search.get("code"),
            search.get("state")
          );

          localStorage.setItem("puff-social-auth", authed.data.token);
          toast("Logged in", {
            position: "top-right",
            duration: 2000,
            icon: <Discord />,
          });

          if (localStorage.getItem("puff-social-auth"))
            gateway.send(Op.LinkUser, {
              token: authed.data.token,
            });

          dispatch(setSessionState({ user: authed.data.user }));

          clearInterval(int);
          if (!child.closed) child.close();
        }
      } catch (error) {}
    }, 500);
  }, []);

  async function logoutUser() {
    localStorage.removeItem("puff-social-auth");
    toast("Logged out", {
      position: "top-right",
      duration: 2000,
      icon: <Leave />,
    });
    dispatch(setSessionState({ user: null }));
  }

  return (
    <div
      className="flex flex-row drop-shadow-xl rounded-md py-2 flex-wrap"
      ref={reactionButton}
    >
      {!!group ? (
        <span className="pr-3 flex flex-row">
          {group.state == GroupState.Chilling ? (
            seshers > 0 &&
            members.filter(
              (mem) =>
                mem.away &&
                typeof mem.device_state == "object" &&
                Object.keys(mem.device_state || {}).length > 0
            ).length != seshers ? (
              <Tippy content="Start Sesh" placement="bottom">
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
              {readyMembers.length > 0 ? (
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
          {[GroupState.Awaiting, GroupState.Chilling].includes(group.state) &&
          deviceConnected ? (
            <Tippy
              content={
                <div className="flex flex-col text-black bg-white dark:text-white dark:bg-neutral-900 drop-shadow-xl rounded-md p-2 w-72">
                  <p className="text-lg font-bold">Profiles</p>
                  <span className="flex flex-col flex-wrap">
                    {Object.keys(deviceProfiles).map((key) => (
                      <span
                        className="select-none text-lg flex justify-between items-center rounded-md bg-white dark:bg-stone-800 drop-shadow-lg p-1 m-1 cursor-pointer hover:bg-gray-300 dark:hover:bg-stone-900"
                        onClick={() => {
                          switchProfile(Number(key));
                          toast(
                            `Switched device profile to ${deviceProfiles[key].name}`
                          );
                        }}
                      >
                        <p className="">{deviceProfiles[key].name}</p>
                        <span className="flex items-center space-x-2">
                          <p className="text-sm">{deviceProfiles[key].time}</p>
                          <p className="opacity-40 text-sm">@</p>
                          <p>
                            {Math.round(deviceProfiles[key].temp * 1.8 + 32)}°
                          </p>
                        </span>
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
                <ArrowSwitch />
              </div>
            </Tippy>
          ) : (
            <></>
          )}
          {gateway.session_id == group.owner_session_id ? (
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
            <Tippy content="Disconnect Device" placement="bottom">
              <div
                className="flex items-center rounded-md p-1 bg-white dark:bg-neutral-800 cursor-pointer h-fit m-1 drop-shadow-xl text-red-400"
                onClick={() => disconnect()}
              >
                <BluetoothDisabled />
              </div>
            </Tippy>
          ) : (
            <></>
          )}
          {deviceConnected ? (
            <Tippy content="Device Settings" placement="bottom">
              <div
                className="flex items-center rounded-md p-1 bg-white dark:bg-neutral-800 cursor-pointer h-fit m-1 drop-shadow-xl"
                onClick={() => setDeviceSettingsModalOpen(true)}
              >
                <DeviceSettings />
              </div>
            </Tippy>
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
                      ].map((emoji) => (
                        <span
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
          onClick={() => window.open("/info")}
        >
          <Info />
        </div>
      </Tippy>
      <Tippy content="Send Feedback" placement="bottom">
        <div
          className="flex items-center rounded-md p-1 bg-white dark:bg-neutral-800 cursor-pointer h-fit m-1 drop-shadow-xl"
          onClick={() => setFeedbackModalOpen(true)}
        >
          <Mail />
        </div>
      </Tippy>
      <Tippy content="Support Development" placement="bottom">
        <div
          className="flex items-center rounded-md p-1 bg-white dark:bg-neutral-800 cursor-pointer h-fit m-1 drop-shadow-xl"
          onClick={() => window.open("https://dstn.to/sponsor")}
        >
          <GiftBox />
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
      <span className="pl-3 flex flex-row">
        <Tippy
          arrow={false}
          interactive
          content={
            <span className="flex flex-col text-black bg-white dark:text-white dark:bg-neutral-900 drop-shadow-xl rounded-md p-2 w-72">
              {session.user ? (
                <span
                  className="flex p-2 rounded-md text-black dark:text-white bg-stone-100 hover:bg-stone-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 cursor-pointer items-center justify-between"
                  onClick={() => logoutUser()}
                >
                  <p>Logout</p>
                  <Leave className="text-red-400" />
                </span>
              ) : (
                <span
                  className="flex p-2 rounded-md text-black dark:text-white bg-stone-100 hover:bg-stone-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 cursor-pointer items-center justify-between"
                  onClick={() => startDiscordOAuth()}
                >
                  <p>Login with Discord</p>
                  <Discord />
                </span>
              )}
            </span>
          }
          placement="bottom-start"
        >
          <div className="flex items-center justify-center rounded-md p-1 bg-white dark:bg-neutral-800 cursor-pointer h-fit m-1 drop-shadow-xl">
            {session.user ? (
              <img
                className="rounded-full p-0.5 w-7 h-7"
                src={`https://cdn.puff.social/avatars/${session.user.id}/${
                  session.user.image
                }.${session.user.image.startsWith("a_") ? "gif" : "png"}`}
              />
            ) : (
              <Account />
            )}
          </div>
        </Tippy>
      </span>
    </div>
  );
}
