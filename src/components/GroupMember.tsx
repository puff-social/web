import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  GatewayGroupMember,
  GatewayMemberDeviceState,
  PuffcoOperatingMap,
  PuffcoOperatingState,
} from "../types/gateway";
import { ChargeSource, DeviceModelMap } from "../utils/puffco";
import { Battery, BatteryBolt } from "./icons/Battery";
import { Checkmark } from "./icons/Checkmark";
import { Counter } from "./icons/Counter";
import { PuffcoContainer } from "./puffco";
import { Tippy } from "./Tippy";
import { Bluetooth } from "./icons/Bluetooth";

interface GroupMemberProps {
  name?: string;
  device?: GatewayMemberDeviceState;
  member?: GatewayGroupMember;
  ready?: boolean;
  connected?: boolean;
  us?: boolean;
  nobodyelse?: boolean;
  nobody?: boolean;
  connectToDevice?: Function;
}

export function GroupMember(props: GroupMemberProps) {
  const [connectDismissed, setConnectDismissed] = useState(false);

  const [bluetooth] = useState<boolean>(() => {
    if (typeof window == "undefined") false;
    return typeof window.navigator.bluetooth !== "undefined";
  });

  if (!bluetooth && props.us && props.nobody)
    return (
      <div className="flex flex-col text-black bg-white dark:text-white dark:bg-neutral-900 drop-shadow-xl rounded-md m-4 w-96 h-80 justify-center items-center">
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
                position: "bottom-right",
              });
            }}
          >
            Copy Group URL
          </button>
        </span>
      </div>
    );
  else if (!bluetooth && props.us) return <></>;
  if (props.us && !props.connected && connectDismissed) return <></>;

  return (
    <div className="flex flex-col text-black bg-white dark:text-white dark:bg-neutral-900 drop-shadow-xl rounded-md m-4 w-96 h-80 justify-center items-center">
      {(props.us && !!props.device) || props.device ? (
        <div className="flex flex-row">
          <PuffcoContainer
            id={
              props.us
                ? "self"
                : `${props.member.session_id}-${props.device.deviceName}`
            }
            className="-z-50 h-full w-[120px]"
            model={DeviceModelMap[props.device.deviceModel].toLowerCase()}
            device={props.device}
          />
          <span className="flex flex-col p-4">
            <p style={{ visibility: "hidden", display: "none" }}>
              {props.device.activeColor.r +
                props.device.activeColor.g +
                props.device.activeColor.b}
            </p>
            <h1 className="m-0 text-xl font-bold truncate">
              {props.us ? props.name : props.member.name}
            </h1>
            {props.device && (
              <div className="flex space-x-3 justify-center">
                <span className="flex flex-row justify-center items-center">
                  <Counter className="m-1 ml-0" />
                  <Tippy content="Total Dabs" placement="bottom">
                    <p className="m-0 p-1 text-lg">
                      {props.device.totalDabs.toLocaleString()}
                    </p>
                  </Tippy>
                </span>
                <Tippy content="Battery" placement="bottom">
                  <span className="flex flex-row justify-center items-center">
                    {props.device.chargeSource == ChargeSource.None ? (
                      <Battery className="m-1" />
                    ) : (
                      <BatteryBolt className="m-1" />
                    )}
                    <p className="m-0 p-1 text-lg">{props.device.battery}%</p>
                  </span>
                </Tippy>
              </div>
            )}

            <span className="mt-4">
              <h2 className="text-2xl m-0">
                {props.device.temperature
                  ? Math.floor(props.device.temperature * 1.8 + 32)
                  : "--"}
                °
              </h2>
              <span className="flex flex-row">
                <h3 className="text-lg m-0">
                  {props.ready &&
                  props.device.state != PuffcoOperatingState.HEAT_CYCLE_ACTIVE
                    ? "Ready"
                    : PuffcoOperatingMap[props.device.state]}
                </h3>
                {props.ready ? (
                  <Checkmark className="ml-2 text-green-700 w-[20px] h-[20px]" />
                ) : (
                  <></>
                )}
              </span>
            </span>
          </span>
        </div>
      ) : props.nobodyelse ? (
        <span className="flex flex-col space-y-8 justify-between items-center">
          <h3 className="text-center text-lg">There's only one sesher here!</h3>
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
                position: "bottom-right",
              });
            }}
          >
            Copy Group URL
          </button>
        </span>
      ) : (
        <span className="flex flex-col space-y-8 justify-between items-center">
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
              onClick={() => setConnectDismissed(true)}
            >
              Dismiss
            </button>
          </span>
        </span>
      )}
    </div>
  );
}
