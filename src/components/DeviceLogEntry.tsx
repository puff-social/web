import {
  AuditLog,
  AuditLogCode,
  ChargeLog,
  ChargeStartLog,
  ClockAdjustLog,
  HeatCycleLog,
  SystemBootLog,
} from "@puff-social/commons/dist/puffco";
import { useSelector } from "react-redux";
import { selectCurrentDeviceState } from "../state/slices/device";
import { formatRelativeTime } from "../utils/time";
import { Tippy } from "./Tippy";
import { Flame, FlameAttention, FlameOff } from "./icons/Flame";
import { Rocket } from "./icons/Rocket";
import { PlugConnected, PlugDisconnected } from "./icons/Plug";
import { BatteryCheck } from "./icons/Battery";
import { ClockAdjust } from "./icons/Clock";
import {
  formatFancyDuration,
  millisToMinutesAndSeconds,
} from "../utils/functions";
import { PowerIcon } from "./icons/Power";

interface DeviceLogEntry {
  entry: AuditLog;
}

const IconMap = {
  [AuditLogCode.HEAT_CYCLE_ENTER_PREHEAT]: <Flame />,
  [AuditLogCode.HEAT_CYCLE_ACTIVE]: <Flame />,
  [AuditLogCode.HEAT_CYCLE_COMPLETE]: <Flame />,
  [AuditLogCode.HEAT_CYCLE_ABORT_ACTIVE]: <Flame />,
  [AuditLogCode.HEAT_CYCLE_ABORT_PREHEAT]: <FlameOff />,
  [AuditLogCode.HEAT_CYCLE_FAULTED]: <FlameAttention />,
  [AuditLogCode.HEAT_CYCLE_BOOSTED]: <Rocket />,
  [AuditLogCode.CHARGE_START]: <PlugConnected />,
  [AuditLogCode.CHARGER_DISCONNECTED]: <PlugDisconnected />,
  [AuditLogCode.CHARGE_COMPLETE]: <BatteryCheck />,
  [AuditLogCode.CLOCK_ADJUST]: <ClockAdjust />,
  [AuditLogCode.SYSTEM_BOOT]: <PowerIcon />,
};

const TitleMap = {
  [AuditLogCode.HEAT_CYCLE_ENTER_PREHEAT]: "Heat Cycle Started",
  [AuditLogCode.HEAT_CYCLE_ACTIVE]: "Heat Cycle Heated",
  [AuditLogCode.HEAT_CYCLE_COMPLETE]: "Heat Cycle Finished",
  [AuditLogCode.HEAT_CYCLE_ABORT_ACTIVE]: "Heat Cycle Aborted",
  [AuditLogCode.HEAT_CYCLE_ABORT_PREHEAT]: "Heat Cycle Preheat Aborted",
  [AuditLogCode.HEAT_CYCLE_FAULTED]: "Heat Cycle Fault",
  [AuditLogCode.HEAT_CYCLE_BOOSTED]: "Heat Cycle Boosted",
  [AuditLogCode.CHARGE_START]: "Charger Connected",
  [AuditLogCode.CHARGER_DISCONNECTED]: "Charger Disconnected",
  [AuditLogCode.CHARGE_COMPLETE]: "Charging Complete",
  [AuditLogCode.CLOCK_ADJUST]: "Device Clock Adjusted",
  [AuditLogCode.SYSTEM_BOOT]: "System Boot",
};

function AuditData({ entry }: DeviceLogEntry) {
  switch (entry.type) {
    case AuditLogCode.HEAT_CYCLE_ENTER_PREHEAT:
    case AuditLogCode.HEAT_CYCLE_COMPLETE:
    case AuditLogCode.HEAT_CYCLE_ABORT_ACTIVE:
    case AuditLogCode.HEAT_CYCLE_ABORT_PREHEAT:
    case AuditLogCode.HEAT_CYCLE_ACTIVE:
    case AuditLogCode.HEAT_CYCLE_FAULTED:
    case AuditLogCode.HEAT_CYCLE_BOOSTED: {
      return (
        <div>
          <p className="text-sm">
            Nominal Temperature:{" "}
            {Math.floor((entry.data as HeatCycleLog).nominalTemp * 1.8 + 32)}°F
          </p>
          <p className="text-sm">
            Actual Temperature:{" "}
            {Math.floor((entry.data as HeatCycleLog).actualTemp * 1.8 + 32)}°F
          </p>
          {entry.type != AuditLogCode.HEAT_CYCLE_ENTER_PREHEAT ? (
            <p className="text-sm">
              Total Time:{" "}
              {(entry.data as HeatCycleLog).timeElapsed * 1000 < 0
                ? "0:00"
                : millisToMinutesAndSeconds(
                    (entry.data as HeatCycleLog).timeElapsed * 1000
                  )}
            </p>
          ) : (
            <></>
          )}
        </div>
      );
    }
    case AuditLogCode.CHARGE_COMPLETE:
    case AuditLogCode.CHARGER_DISCONNECTED: {
      return (
        <div>
          <p className="text-sm">
            Battery Temperature: start{" "}
            {Math.floor((entry.data as ChargeLog).startTemp * 1.8 + 32)}°F - end{" "}
            {Math.floor((entry.data as ChargeLog).endTemp * 1.8 + 32)}°F
          </p>
          <p className="text-sm">
            Total Time:{" "}
            {(entry.data as ChargeLog).timeElapsed * 1000 < 0
              ? "0:00"
              : millisToMinutesAndSeconds(
                  (entry.data as ChargeLog).timeElapsed * 1000
                )}
          </p>
        </div>
      );
    }
    case AuditLogCode.CHARGE_START: {
      return (
        <div>
          <p className="text-sm">
            Battery Temperature:{" "}
            {Math.floor((entry.data as ChargeStartLog).temperature * 1.8 + 32)}
            °F
          </p>
          <p className="text-sm">
            Battery Voltage:{" "}
            {Math.floor((entry.data as ChargeStartLog).voltage)} V
          </p>
        </div>
      );
    }
    case AuditLogCode.CLOCK_ADJUST: {
      return (
        <div>
          <p className="text-sm">
            Previous Timestamp:{" "}
            {new Date(
              (entry.data as ClockAdjustLog).previous * 1000
            ).toLocaleString()}
          </p>
          <p className="text-sm">
            Device Uptime:{" "}
            {(entry.data as ChargeLog).timeElapsed * 1000 < 1
              ? "now"
              : formatFancyDuration(
                  (entry.data as ClockAdjustLog).uptime * 1000
                )}
          </p>
        </div>
      );
    }
    case AuditLogCode.SYSTEM_BOOT: {
      return (
        <div>
          <p className="text-sm">
            Cause: {(entry.data as SystemBootLog).cause}
          </p>
        </div>
      );
    }
  }
}

export function DeviceLogEntry({ entry }: DeviceLogEntry) {
  const currentDevice = useSelector(selectCurrentDeviceState);

  return TitleMap[entry.type] ? (
    <div className="bg-neutral-200 dark:bg-neutral-700 rounded-md p-1">
      <div className="flex flex-row w-full justify-between ">
        <div className="flex flex-col">
          <div className="flex flex-row items-center space-x-1">
            {IconMap[entry.type]} <p>{TitleMap[entry.type]}</p>
          </div>
        </div>
        <div className="flex flex-col">
          <Tippy content={`${new Date(entry.realTimestamp).toLocaleString()}`}>
            <div>
              <p className="opacity-40">
                {formatRelativeTime(new Date(entry.realTimestamp), new Date())}
              </p>
            </div>
          </Tippy>
        </div>
      </div>
      {[
        AuditLogCode.HEAT_CYCLE_ENTER_PREHEAT,
        AuditLogCode.HEAT_CYCLE_ACTIVE,
        AuditLogCode.HEAT_CYCLE_COMPLETE,
        AuditLogCode.HEAT_CYCLE_ABORT_ACTIVE,
        AuditLogCode.HEAT_CYCLE_ABORT_PREHEAT,
        AuditLogCode.HEAT_CYCLE_FAULTED,
        AuditLogCode.HEAT_CYCLE_BOOSTED,
        AuditLogCode.CHARGER_DISCONNECTED,
        AuditLogCode.CHARGE_COMPLETE,
        AuditLogCode.CLOCK_ADJUST,
        AuditLogCode.SYSTEM_BOOT,
      ].includes(entry.type) && entry.data ? (
        <>
          <div className="space-y-1 mt-2">
            <hr className="w-full rounded-md opacity-20 border-neutral-500 dark:border-neutral-400" />
            <div className="ml-1">
              <AuditData entry={entry} />
            </div>
          </div>
        </>
      ) : (
        <></>
      )}
    </div>
  ) : (
    <></>
  );
}
