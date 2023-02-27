import { useEffect, useState } from "react";
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

interface GroupMemberProps {
  name?: string;
  device: GatewayMemberDeviceState;
  member?: GatewayGroupMember;
  ready?: boolean;
  connected?: boolean;
  us?: boolean;
  connectToDevice?: Function;
}

export function GroupMember(props: GroupMemberProps) {
  const [time, setTime] = useState(Date.now());
  const [connectDismissed, setConnectDismissed] = useState(false);

  const [bluetooth] = useState<boolean>(() => {
    if (typeof window == "undefined") false;
    return typeof window.navigator.bluetooth !== "undefined";
  });

  useEffect(() => {
    setInterval(() => setTime(Date.now()), 800);
  }, []);

  if (!bluetooth && props.us) return <></>;
  if (props.us && !props.connected && connectDismissed) return <></>;

  return (
    <div className="flex flex-col text-black bg-white dark:text-white dark:bg-neutral-900 drop-shadow-xl rounded-md m-4 w-96 h-80 justify-center items-center">
      {(props.us && props.connected) || props.device ? (
        <div className="flex flex-row">
          <PuffcoContainer
            id={
              props.us
                ? "self"
                : `${props.member.session_id}-${props.device.deviceName}`
            }
            className="-z-50 h-full w-[120px]"
            model={DeviceModelMap[props.device.deviceModel].toLowerCase()}
            demo={props.device}
          />
          <span className="flex flex-col p-4">
            <p style={{ visibility: "hidden", display: "none" }}>{time}</p>
            <h1 className="m-0 text-xl font-bold truncate">
              {props.us ? props.name : props.member.name}
            </h1>
            {(props.us && props.connected) ||
              (props.device && (
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
              ))}

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
      ) : (
        <span className="flex flex-col space-y-8 justify-center items-center">
          <div className="flex flex-row items-center justify-center space-x-6">
            <img width="70px" src="/peak.gif" />
            <p className="text-center text-lg break-normal w-48">
              Connect a device to join the sesh
            </p>
          </div>
          <span className="flex space-x-4">
            <button
              className="w-32 self-center rounded-md bg-indigo-700 hover:bg-indigo-800 text-white p-1"
              onClick={() => props.connectToDevice()}
            >
              Connect
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
