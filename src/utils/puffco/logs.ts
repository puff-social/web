import {
  AuditLog,
  AuditLogCode,
  BaseAuditLogOffset,
  ChargeLog,
  ChargeLowLog,
  ChargeOffset,
  ChargeStartLog,
  ChargeStartOffset,
  ClockAdjustLog,
  ClockAdjustOffset,
  HeatCycleLog,
  HeatCycleOffset,
  HeatStartLowBattLog,
  MoodLightEndedLog,
  MoodLightEndedOffset,
  SystemBootLog,
} from "@puff-social/commons/dist/puffco";
import { convertRelativeTimestamp } from "../time";

export function parseAuditLog(
  cursor: number,
  utc: number,
  log: Buffer
): AuditLog {
  const timestamp = new Date(
    log.readUInt32LE(BaseAuditLogOffset.TIMESTAMP) * 1000
  );
  const logType = log[BaseAuditLogOffset.TYPE_CODE];

  let data:
    | HeatCycleLog
    | ChargeStartLog
    | ChargeLog
    | ClockAdjustLog
    | MoodLightEndedLog
    | ChargeLowLog
    | HeatStartLowBattLog
    | SystemBootLog;
  switch (logType) {
    case AuditLogCode.CHARGE_START: {
      data = {
        temperature: Number(
          log.readInt8(ChargeStartOffset.BATTERY_TEMP).toFixed(1)
        ),
        voltage: Number(
          log.readInt8(ChargeStartOffset.BATTERY_VOLTAGE).toFixed(3)
        ),
      } as ChargeStartLog;
      break;
    }
    case AuditLogCode.CHARGE_COMPLETE:
    case AuditLogCode.CHARGER_DISCONNECTED: {
      data = {
        startVoltage: Number(
          (
            log.readUInt16LE(ChargeOffset.BATTERY_VOLTAGE_AT_START_OF_CHARGE) /
            1000
          ).toFixed(3)
        ),
        endVoltage: Number(
          (
            log.readUInt16LE(ChargeOffset.BATTERY_VOLTAGE_AT_END_OF_CHARGE) /
            1000
          ).toFixed(3)
        ),
        startTemp: Number(
          log.readInt8(ChargeOffset.BATTERY_TEMP_AT_START_OF_CHARGE).toFixed(0)
        ),
        endTemp: Number(
          log.readInt8(ChargeOffset.BATTERY_TEMP_AT_END_OF_CHARGE).toFixed(0)
        ),
        timeElapsed: Number(
          log
            .readUInt16LE(ChargeOffset.TIME_ELAPSED_SINCE_START_OF_CHARGE)
            .toFixed(0)
        ),
        chargeDelivered: Number(
          (
            log.readUInt16LE(ChargeOffset.CHARGE_DELIVERED_TO_BATTERY) / 3.6
          ).toFixed(0)
        ),
      } as ChargeLog;
      break;
    }
    case AuditLogCode.HEAT_CYCLE_ENTER_PREHEAT:
    case AuditLogCode.HEAT_CYCLE_ABORT_PREHEAT:
    case AuditLogCode.HEAT_CYCLE_ABORT_ACTIVE:
    case AuditLogCode.HEAT_CYCLE_COMPLETE:
    case AuditLogCode.HEAT_CYCLE_BOOSTED:
    case AuditLogCode.HEAT_CYCLE_ACTIVE:
    case AuditLogCode.HEAT_CYCLE_FAULTED: {
      data = {
        nominalTemp: Number(
          (
            log.readInt16LE(HeatCycleOffset.HEAT_CYCLE_NOMINAL_TEMP) / 10
          ).toFixed(1)
        ),
        commandedTemp: Number(
          (
            log.readInt16LE(HeatCycleOffset.PRESENT_COMMANDED_TEMP) / 10
          ).toFixed(1)
        ),
        actualTemp: Number(
          (log.readInt16LE(HeatCycleOffset.PRESENT_ACTUAL_TEMP) / 10).toFixed(1)
        ),
        totalTime: Number(
          (log.readInt16LE(HeatCycleOffset.TOTAL_TIME) / 100).toFixed(2)
        ),
        timeElapsed: Number(
          (log.readInt16LE(HeatCycleOffset.TIME_ELAPSED) / 100).toFixed(2)
        ),
      } as HeatCycleLog;
      break;
    }
    case AuditLogCode.MOOD_LIGHT_ENDED: {
      data = {
        usage: Number(log.readUInt8(MoodLightEndedOffset.USAGE)),
        duration: Number(
          log.readUInt16LE(MoodLightEndedOffset.MOOD_LIGHT_DURATION)
        ),
        ulid: log.subarray(MoodLightEndedOffset.ULID).toString("hex"),
      } as MoodLightEndedLog;
      break;
    }
    case AuditLogCode.SYSTEM_BOOT: {
      const causeValue = log.readUInt32LE(8);
      const causeMessages: string[] = [];

      if (causeValue & 1) causeMessages.push("Power-on");

      if (!(causeValue & 1)) {
        if (causeValue & (1 << 2)) causeMessages.push("AVDD brown-out");
        if (causeValue & (1 << 3)) causeMessages.push("DVDD brown-out");
        if (causeValue & (1 << 4)) causeMessages.push("DEC brown-out");
        if (causeValue & (1 << 8)) causeMessages.push("Pin");
      }

      if (!(causeValue & 29)) {
        if (causeValue & (1 << 9)) causeMessages.push("Lockup");
        if (causeValue & (1 << 10)) causeMessages.push("Software request");
        if (causeValue & (1 << 11)) causeMessages.push("Watchdog");
        if (causeValue & (1 << 16)) causeMessages.push("EM4");
      }

      data = {
        cause: causeMessages.length ? causeMessages.join(", ") : "Unknown",
      } as SystemBootLog;
      break;
    }
    case AuditLogCode.CLOCK_ADJUST: {
      data = {
        previous: log.readUInt32LE(ClockAdjustOffset.PREVIOUS_TIMESTAMP),
        uptime: Number(
          log.readUInt32LE(ClockAdjustOffset.SYSTEM_UPTIME).toFixed(0)
        ),
      } as ClockAdjustLog;
      break;
    }
  }

  return {
    id: cursor,
    type: logType,
    timestamp: timestamp.getTime(),
    realTimestamp: convertRelativeTimestamp(timestamp, utc),
    data,
  };
}
