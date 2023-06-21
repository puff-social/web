import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  GatewayGroup,
  GatewayGroupMember,
  GatewayMemberDeviceState,
  PuffcoOperatingMap,
} from "../types/gateway";
import {
  EASTER_EGG_CYCLE_COUNTS,
  TEMPERATURE_MAX,
  TEMPERATURE_MIN,
} from "../utils/constants";
import { Battery, BatteryBolt } from "./icons/Battery";
import { Checkmark } from "./icons/Checkmark";
import { Counter } from "./icons/Counter";
import { PuffcoContainer } from "./puffco";
import { Tippy } from "./Tippy";
import { Bluetooth } from "./icons/Bluetooth";
import { Crown } from "./icons/Crown";
import { Icon3D } from "./icons/3DIcon";
import { Dots } from "./icons/Dots";
import { Kick } from "./icons/Kick";
import { gateway } from "../utils/gateway";
import { getLeaderboardDevice } from "../utils/hash";
import { ShareIcon } from "./icons/Share";
import { Away, UnAway } from "./icons/Away";
import { millisToMinutesAndSeconds } from "../utils/functions";
import { Leaf } from "./icons/Leaf";
import { PlugDisconnected } from "./icons/Plug";
import { User } from "../types/api";
import { Mobile } from "./icons/Mobile";
import { Money } from "./icons/Money";
import { Op, UserFlags } from "@puff-social/commons";
import {
  ChamberType,
  ChargeSource,
  ProductModelMap,
  PuffcoOperatingState,
} from "@puff-social/commons/dist/puffco/constants";
import { VoiceWaves } from "./icons/Voice";
import { IntensityIcon } from "./IntensityIcon";
import { useSelector } from "react-redux";
import { selectSessionState } from "../state/slices/session";
import { Device } from "../utils/puffco";

interface GroupMemberProps {
  strain?: string;
  group?: GatewayGroup;
  device?: GatewayMemberDeviceState;
  member?: GatewayGroupMember;
  leaderboardPosition?: number;
  ready?: boolean;
  away?: boolean;
  connected?: boolean;
  connecting?: boolean;
  disconnected?: boolean;
  owner?: boolean;
  us?: boolean;
  nobodyelse?: boolean;
  nobody?: boolean;
  connectToDevice?: Function;
  user?: User;
  instance?: Device;
  headless?: boolean;
  connectDismissed: boolean;
  setConnectDismissed?: Dispatch<SetStateAction<boolean>>;
  setStrainModalOpen?: Dispatch<SetStateAction<boolean>>;
}

export function GroupMember(props: GroupMemberProps) {
  const userActionsButton = useRef<HTMLSpanElement>();
  const [hoveringCard, setHoveringCard] = useState(false);
  const [leaderboardPos, setLeaderboardPos] = useState<number>(
    props.leaderboardPosition || 0
  );

  const session = useSelector(selectSessionState);

  const [bluetooth] = useState<boolean>(() => {
    if (props.headless) return false;
    if (typeof window == "undefined") return false;
    return typeof window.navigator.bluetooth !== "undefined";
  });

  useEffect(() => {
    (async () => {
      if (props.device?.deviceMac) {
        const lb = await getLeaderboardDevice(
          Buffer.from(props.device.deviceMac).toString("base64")
        );
        setLeaderboardPos(lb.data.position);
      }
    })();
  }, [props.device?.totalDabs]);

  useEffect(() => {
    setLeaderboardPos(props.leaderboardPosition);
  }, [props.leaderboardPosition]);

  if ((props.nobodyelse && props.headless) || (props.headless && props.us)) {
    return <></>;
  }

  if (!bluetooth && props.us && !props.nobody && !props.connectDismissed)
    return (
      <div className="flex flex-col text-black bg-neutral-100 dark:text-white dark:bg-neutral-800 drop-shadow-xl rounded-md m-1 px-8 w-[440px] h-72 justify-center items-center">
        <span className="flex flex-col space-y-8 justify-between items-center">
          <h3 className="text-center text-lg">Bluetooth not supported</h3>
          <p className="text-center text-small break-normal px-2">
            The browser you're using doesn't support bluetooth, switch to a
            chromium based browser like Google Chrome or Edge to connect a
            device.
          </p>
          <button
            className="w-32 self-center rounded-md bg-gray-700 hover:bg-gray-800 text-white p-1"
            onClick={() => props.setConnectDismissed(true)}
          >
            Dismiss
          </button>
        </span>
      </div>
    );

  if (!bluetooth && props.us && props.nobody)
    return (
      <div className="flex flex-col text-black bg-neutral-100 dark:text-white dark:bg-neutral-800 drop-shadow-xl rounded-md m-4 px-8 w-[440px] h-72 justify-center items-center">
        <span className="flex flex-col space-y-8 justify-between items-center">
          <h3 className="text-center text-lg">Ain't no seshers here!</h3>
          <p className="text-center text-small break-normal px-2">
            Your browser doesn't support bluetooth devices, this will dismiss
            once a sesher connects.
          </p>
          <button
            className="w-48 self-center rounded-md bg-indigo-700 hover:bg-indigo-800 text-white p-1"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast("Copied group URL to clipboard", {
                icon: "📋",
                duration: 2500,
                position: "top-right",
              });
            }}
          >
            Copy Group URL
          </button>
        </span>
      </div>
    );
  else if (!bluetooth && props.us) return <></>;
  if (props.us && !props.connected && props.connectDismissed) return <></>;

  return (
    <div
      className={`flex justify-center items-center m-1 h-72 w-[440px] ${
        props.device
          ? props.member?.user?.flags & UserFlags.admin
            ? "rounded-md bg-gradient-to-r from-blue-500/60 to-purple-700/60 p-px"
            : props.member?.user?.flags & UserFlags.supporter
            ? "rounded-md bg-gradient-to-r from-green-500/60 to-yellow-600/60 p-px"
            : ""
          : ""
      }`}
      id={props.us ? gateway.session_id : props.member?.session_id}
    >
      <div
        className={`group flex flex-col text-black bg-neutral-100 dark:text-white dark:bg-neutral-800 drop-shadow-xl rounded-md px-4 h-full w-[440px] justify-center items-center overflow-hidden ${
          props.member?.away ? "brightness-75" : ""
        }`}
        onMouseEnter={() => setHoveringCard(true)}
        onMouseLeave={() => setHoveringCard(false)}
      >
        {(props.us && !!props.device && props.connected) ||
        (!props.us && !!props.device) ? (
          <div className="flex flex-col justify-center w-full overflow-hidden">
            <div className="flex flex-row-reverse absolute right-0 bottom-0 m-4">
              <Tippy
                placement="right-start"
                trigger="click"
                disabled={hoveringCard ? false : true}
                arrow={false}
                content={
                  <div className="flex flex-col bg-neutral-300 dark:bg-neutral-900 rounded-lg drop-shadow-xl p-4 space-y-2 w-72">
                    {props.us ? (
                      <>
                        <span
                          className="flex p-2 rounded-md text-black dark:text-white bg-stone-100 hover:bg-stone-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 cursor-pointer justify-between"
                          onClick={() => {
                            props.setStrainModalOpen(true);
                          }}
                        >
                          <p>Set strain</p>
                          <Leaf />
                        </span>
                        <span
                          className="flex p-2 rounded-md text-black dark:text-white bg-stone-100 hover:bg-stone-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 cursor-pointer justify-between"
                          onClick={() => {
                            toast(
                              `Marked you as ${
                                props.member?.away ? "no longer away" : "away"
                              }`,
                              {
                                position: "top-right",
                                duration: 2500,
                                icon: props.member?.away ? (
                                  <UnAway />
                                ) : (
                                  <Away />
                                ),
                              }
                            );
                            gateway.send(Op.UpdateUser, {
                              away: !props.member?.away,
                            });
                          }}
                        >
                          {props.member?.away ? (
                            <>
                              <p>Unset away state</p>
                              <UnAway />
                            </>
                          ) : (
                            <>
                              <p>Set away state</p>
                              <Away />
                            </>
                          )}
                        </span>
                      </>
                    ) : (
                      <></>
                    )}
                    <span
                      className="flex p-2 rounded-md text-black dark:text-white bg-stone-100 hover:bg-stone-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 cursor-pointer justify-between transition-all"
                      onClick={() => {
                        toast(
                          `Copied share card for ${props.device.deviceName}`,
                          {
                            position: "top-right",
                            duration: 2500,
                            icon: "📋",
                          }
                        );
                        navigator.clipboard.writeText(
                          `https://puff.social/api/device/device_${Buffer.from(
                            props.device.deviceMac
                          ).toString("base64")}`
                        );
                      }}
                    >
                      <p>Copy share card</p>
                      <ShareIcon />
                    </span>
                    {gateway.session_id == props.group?.owner_session_id ||
                    session.user?.flags & UserFlags.admin ? (
                      <>
                        {props.member?.session_id !=
                        props.group?.owner_session_id ? (
                          <span
                            className="flex p-2 rounded-md bg-stone-100 hover:bg-stone-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 cursor-pointer justify-between transition-all"
                            onClick={() =>
                              gateway.send(Op.TransferOwnership, {
                                session_id: props.member?.session_id,
                              })
                            }
                          >
                            <p>Make owner</p>
                            <Crown className="text-green-700" />
                          </span>
                        ) : (
                          <></>
                        )}
                        {props.member?.session_id != gateway.session_id ? (
                          <span
                            className="flex p-2 rounded-md bg-stone-100 hover:bg-stone-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 cursor-pointer justify-between transition-all"
                            onClick={() =>
                              gateway.send(Op.KickFromGroup, {
                                session_id: props.member?.session_id,
                              })
                            }
                          >
                            <p>Kick from group</p>
                            <Kick className="text-red-600 dark:text-red-300" />
                          </span>
                        ) : (
                          <></>
                        )}
                      </>
                    ) : (
                      <></>
                    )}
                  </div>
                }
                interactive
              >
                <div>
                  <Tippy content="Actions" placement="top-end" animation="fade">
                    <span
                      className="opacity-20 group-hover:opacity-100 transition-all"
                      ref={userActionsButton}
                    >
                      <Dots />
                    </span>
                  </Tippy>
                </div>
              </Tippy>
            </div>
            <div className="flex flex-row w-full h-full items-center justify-center">
              <PuffcoContainer
                id={
                  props.us
                    ? "self"
                    : `${props.member?.session_id}-${props.device.deviceMac}`
                }
                svgClassName="w-40 h-full"
                className="-z-50 min-w-[40%]"
                model={
                  ProductModelMap[props.device.deviceModel]
                    ? ProductModelMap[props.device.deviceModel].toLowerCase()
                    : ProductModelMap[0].toLowerCase()
                }
                device={props.device}
              />
              <span className="flex flex-col p-4 w-full min-w-[60%]">
                <p style={{ visibility: "hidden", display: "none" }}>
                  {props.device.activeColor.r +
                    props.device.activeColor.g +
                    props.device.activeColor.b}
                </p>
                <span className="flex flex-row space-x-2 items-center">
                  {props.member?.user ? (
                    <Tippy content="Leaderboard Position" placement="top-start">
                      <div className="flex items-center rounded-md px-1 bg-white dark:bg-neutral-700 drop-shadow-xl text-black dark:text-white">
                        <p className="opacity-70">#{leaderboardPos || "N/A"}</p>
                      </div>
                    </Tippy>
                  ) : (
                    <></>
                  )}
                  {props.member?.strain ? (
                    <Tippy content={props.member?.strain} placement="top-start">
                      <div className="flex items-center">
                        <Leaf className="text-green-600" />
                      </div>
                    </Tippy>
                  ) : (
                    <></>
                  )}
                  {(
                    props.us ? props.disconnected : props.member?.disconnected
                  ) ? (
                    <Tippy content="User reconnecting..." placement="top-start">
                      <div className="flex items-center">
                        <PlugDisconnected className="text-yellow-600" />
                      </div>
                    </Tippy>
                  ) : (
                    <></>
                  )}
                  {props.member?.away ? (
                    <Tippy content="Away" placement="top-start">
                      <div className="flex items-center">
                        <Away className="text-yellow-700" />
                      </div>
                    </Tippy>
                  ) : (
                    <></>
                  )}
                  {props.member?.voice ? (
                    <Tippy
                      content={`Currently in voice : ${props.member?.voice.name}`}
                      placement="top-start"
                    >
                      <a
                        target="_blank"
                        href={props.member?.voice.link || "/discord"}
                      >
                        <div className="flex items-center opacity-40 cursor">
                          <VoiceWaves />
                        </div>
                      </a>
                    </Tippy>
                  ) : (
                    <></>
                  )}
                  {props.member?.mobile ? (
                    <Tippy content="Mobile" placement="top-start">
                      <div className="flex items-center">
                        <Mobile className="text-black dark:text-white opacity-50" />
                      </div>
                    </Tippy>
                  ) : (
                    <></>
                  )}
                  {props.member?.session_id == props.group?.owner_session_id ? (
                    <Tippy content="Group owner" placement="top-start">
                      <div className="flex items-center">
                        <Crown className="text-green-700" />
                      </div>
                    </Tippy>
                  ) : (
                    <></>
                  )}
                </span>
                <span className="space-x-2 flex flex-row items-center">
                  {props.member?.user && props.member?.user.image ? (
                    <img
                      className="rounded-full p-0.5 w-7 h-7"
                      src={`https://cdn.puff.social/avatars/${
                        props.member?.user.id
                      }/${props.member?.user.image}.${
                        props.member?.user.image.startsWith("a_")
                          ? "gif"
                          : "png"
                      }`}
                    />
                  ) : (
                    <></>
                  )}
                  <Tippy
                    content={props.device.deviceName}
                    placement="bottom-start"
                  >
                    <h1 className="m-0 text-xl font-bold truncate">
                      {props.member?.user?.display_name ||
                        props.member?.device_state?.deviceName ||
                        "Unknown"}
                    </h1>
                  </Tippy>
                  {props.member?.user?.flags & UserFlags.supporter ? (
                    <Tippy content="Supporter" placement="bottom">
                      <div>
                        <Money className="w-4" />
                      </div>
                    </Tippy>
                  ) : (
                    <></>
                  )}
                </span>
                {props.device && (
                  <div className="flex space-x-2">
                    <span className="flex flex-row justify-center items-center">
                      <Tippy
                        content={`${
                          props.device.dabsPerDay || `0.0`
                        } avg per day`}
                        placement="right"
                      >
                        <div
                          className={`flex justify-center ${
                            EASTER_EGG_CYCLE_COUNTS.includes(
                              props.device.totalDabs
                            )
                              ? "rainbow"
                              : ""
                          }`}
                        >
                          <Counter className="m-1 ml-0" />
                          <p className="m-0 p-1 text-lg">
                            {props.device.totalDabs.toLocaleString()}
                          </p>
                        </div>
                      </Tippy>
                    </span>
                    <span className="flex flex-row justify-center items-center">
                      {props.device.chargeSource == ChargeSource.None ? (
                        <Battery className="m-1" />
                      ) : (
                        <BatteryBolt className="m-1" />
                      )}
                      <p className="m-0 p-1 text-lg">{props.device.battery}%</p>
                    </span>
                  </div>
                )}

                <span className="mt-4">
                  {props.device.chamberType == ChamberType.None ? (
                    "No Chamber"
                  ) : props.device.temperature &&
                    props.device.temperature >= TEMPERATURE_MIN &&
                    props.device.temperature <= TEMPERATURE_MAX ? (
                    <h2 className="text-2xl">
                      {Math.floor(props.device.temperature * 1.8 + 32)}°
                    </h2>
                  ) : (
                    <h2 className="text-2xl">--</h2>
                  )}
                  <span className="flex flex-row">
                    <h3 className="text-lg m-0">
                      {props.ready &&
                      props.device.state !=
                        PuffcoOperatingState.HEAT_CYCLE_ACTIVE
                        ? "Ready"
                        : PuffcoOperatingMap[props.device.state]}
                      {[7, 8].includes(props.device.state)
                        ? ` - ${millisToMinutesAndSeconds(
                            props.device.stateTime * 1000
                          )}`
                        : ""}
                    </h3>
                    {props.ready ? (
                      <Checkmark className="ml-2 text-green-700 w-[20px] h-[20px]" />
                    ) : (
                      <></>
                    )}
                  </span>
                  <Tippy content="Current device profile" placement="bottom">
                    <span className="flex space-x-2">
                      <p className="text-sm truncate max-w-[8rem]">
                        {props.device.profile.name}
                      </p>
                      <span className="flex space-x-2 text-sm">
                        <p>({props.device.profile.time}</p>
                        <p className="opacity-40">@</p>
                        <p>
                          {Math.floor(props.device.profile.temp * 1.8 + 32)}°)
                        </p>
                      </span>
                    </span>
                  </Tippy>

                  <div className="flex flex-row space-x-4">
                    {props.device.chamberType == ChamberType["3D"] ? (
                      <>
                        <Tippy content="3D Chamber" placement="auto">
                          <span className="flex mt-2 px-1 border border-black dark:border-white text-black dark:text-white items-center justify-center w-fit">
                            <Icon3D />
                          </span>
                        </Tippy>
                        {props.device.profile.intensity &&
                        props.device.profile.intensity > 0 ? (
                          <Tippy content="Profile Intensity" placement="auto">
                            <span className="flex">
                              <IntensityIcon
                                intensity={props.device.profile.intensity}
                                card
                              />
                            </span>
                          </Tippy>
                        ) : (
                          <></>
                        )}
                      </>
                    ) : (
                      <></>
                    )}
                  </div>
                </span>
              </span>
            </div>
            <div />
          </div>
        ) : props.nobodyelse ? (
          <span className="flex flex-col space-y-8 justify-center items-center h-72">
            <h3 className="text-center text-lg">
              There's only one sesher here!
            </h3>
            <p className="text-center text-small break-normal px-2">
              You should invite some people to sync up your dab :)
            </p>
            <button
              className="w-48 self-center rounded-md bg-indigo-700 hover:bg-indigo-800 text-white p-1"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast("Copied group URL to clipboard", {
                  icon: "📋",
                  duration: 2500,
                  position: "top-right",
                });
              }}
            >
              Copy Group URL
            </button>
          </span>
        ) : props.connecting ? (
          <span className="flex flex-col space-y-8 justify-center items-center h-72">
            <div className="flex flex-row items-center justify-center space-x-6">
              <p className="text-center text-lg break-normal">
                {props.instance.device
                  ? `Connecting to ${props.instance.device.name}`
                  : "Pick a device from the bluetooth menu."}
              </p>
            </div>
          </span>
        ) : (
          <span className="flex flex-col space-y-8 justify-center items-center h-72">
            <div className="flex flex-row items-center justify-center space-x-6">
              <img width="70px" src="/peak.gif" />
              <p className="text-center text-lg break-normal w-48">
                Connect a device to join the sesh
              </p>
            </div>
            <span className="flex space-x-4">
              <button
                className="flex justify-center items-center w-32 self-center rounded-md bg-indigo-700 hover:bg-indigo-800 text-white p-1"
                onClick={() => props.connectToDevice()}
              >
                <Bluetooth className="h-5 mr-1" /> Connect
              </button>
              <button
                className="w-32 self-center rounded-md bg-gray-700 hover:bg-gray-800 text-white p-1"
                onClick={() => props.setConnectDismissed(true)}
              >
                Dismiss
              </button>
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
