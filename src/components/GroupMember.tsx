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

  useEffect(() => {
    setInterval(() => setTime(Date.now()), 800);
  }, []);

  return (
    <div className="flex flex-col text-black bg-white dark:text-white dark:bg-neutral-900 drop-shadow-xl rounded-md m-4 w-64 h-[800px] justify-between items-center">
      <div className="flex flex-col p-8 text-center justify-center items-center">
        <p style={{ visibility: "hidden", display: "none" }}>{time}</p>
        <h1 className="m-0 text-center text-xl font-bold w-48 truncate">
          {props.us ? props.name : props.member.name}
        </h1>
        {(props.us && props.connected) ||
          (props.device && (
            <div className="flex space-x-3 justify-center">
              <span className="flex flex-row justify-center items-center">
                <Counter className="m-1" />
                <p className="m-0 p-1 text-lg">
                  {props.device.totalDabs.toLocaleString()}
                </p>
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
          ))}
      </div>
      {(props.us && props.connected) || props.device ? (
        <>
          <PuffcoContainer
            id={
              props.us
                ? "self"
                : `${props.member.session_id}-${props.device.deviceName}`
            }
            model={DeviceModelMap[props.device.deviceModel].toLowerCase()}
            demo={props.device}
          />
          <div className="flex flex-col p-4 justify-center items-center text-center">
            <h2 className="text-[32px] m-0">
              {props.device.temperature
                ? Math.floor(props.device.temperature * 1.8 + 32)
                : "--"}
              °
            </h2>

            <span className="flex flex-row text-center self-center items-center">
              <h3 className="text-[25px] m-0">
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
            onClick={() => props.connectToDevice()}
          >
            Connect
          </button>
        </>
      )}
    </div>
  );
}
