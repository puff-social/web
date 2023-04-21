import { createHash } from "crypto";
import { EventEmitter } from "events";
import { unpack, pack } from "byte-data";
import { GatewayMemberDeviceState } from "../types/gateway";
import {
  convertFromHex,
  convertHexStringToNumArray,
  millisToMinutesAndSeconds,
  decimalToHexString,
  flipHexString,
  gattPoller,
  getValue,
  hexToFloat,
  constructLoraxCommand,
  processLoraxReply,
  getLoraxValueShort,
  sendLoraxValueShort,
  intArrayToMacAddress,
} from "./functions";
import { DeviceInformation, DiagData } from "../types/api";
import { trackDiags } from "./hash";
import { LoraxLimits, LoraxMessage, PuffcoProfile } from "../types/puffco";
import { gateway } from "./gateway";

export const SILLABS_OTA_SERVICE = "1d14d6ee-fd63-4fa1-bfa4-8f47b42119f0";
export const LORAX_SERVICE = "e276967f-ea8a-478a-a92e-d78f5dd15dd5";
export const PUP_SERVICE = "420b9b40-457d-4abe-a3bf-71609d79581b";
export const SERVICE = "06caf9c0-74d3-454f-9be9-e30cd999c17a";
export const MODEL_SERVICE = "0000180a-0000-1000-8000-00805f9b34fb";
export const MODEL_INFORMATION = "00002a24-0000-1000-8000-00805f9b34fb";
export const FIRMWARE_INFORMATION = "00002a28-0000-1000-8000-00805f9b34fb";
export const SERIAL_NUMBER = "00002a25-0000-1000-8000-00805f9b34fb";
export const BASE_CHARACTERISTIC = `f9a98c15-c651-4f34-b656-d100bf5800`;
export const HANDSHAKE_KEY = Buffer.from("FUrZc0WilhUBteT2JlCc+A==", "base64");
export const LORAX_HANDSHAKE_KEY = Buffer.from(
  "ZMZFYlbyb1scoSc3pd1x+w==",
  "base64"
);

export let isLorax: boolean;
export let deviceModel: string;
export let deviceFirmware: string;
export let modelService: BluetoothRemoteGATTService;
export let service: BluetoothRemoteGATTService;
export let device: BluetoothDevice;
export let server: BluetoothRemoteGATTServer;
export let poller: EventEmitter;
export let profiles: Record<number, PuffcoProfile>;

export const loraxLimits: LoraxLimits = {
  maxCommands: 0,
  maxFiles: 0,
  maxPayload: 0,
};

export const loraxMessages = new Map<number, LoraxMessage>();
export let lastLoraxSequenceId = 0;

export const decoder = new TextDecoder("utf-8");
export const encoder = new TextEncoder();

export const LoraxCharacteristic = {
  VERSION: "05434bca-cc7f-4ef6-bbb3-b1c520b9800c",
  COMMAND: "60133d5c-5727-4f2c-9697-d842c5292a3c",
  REPLY: "8dc5ec05-8f7d-45ad-99db-3fbde65dbd9c",
  EVENT: "43312cd1-7d34-46ce-a7d3-0a98fd9b4cb8",
};

export const LoraxCommands = {
  GET_ACCESS_SEED: 0,
  UNLOCK_ACCESS: 1,
  GET_LIMITS: 2,
  ACK_EVENTS: 3,
  READ_SHORT: 16,
  WRITE_SHORT: 17,
  STAT_SHORT: 18,
  UNLINK: 19,
  OPEN: 32,
  READ: 33,
  WRITE: 34,
  WATCH: 35,
  UNWATCH: 36,
  STAT: 37,
  CLOSE: 38,
};

export const Characteristic = {
  ACCESS_KEY: `${BASE_CHARACTERISTIC}e0`,
  EUID: `${BASE_CHARACTERISTIC}01`,
  GIT_HASH: `${BASE_CHARACTERISTIC}02`,
  COMMAND: `${BASE_CHARACTERISTIC}40`,
  BATTERY_SOC: `${BASE_CHARACTERISTIC}20`,
  BATTERY_VOLTAGE: `${BASE_CHARACTERISTIC}21`,
  OPERATING_STATE: `${BASE_CHARACTERISTIC}22`,
  STATE_ELAPSED_TIME: `${BASE_CHARACTERISTIC}23`,
  STATE_TOTAL_TIME: `${BASE_CHARACTERISTIC}24`,
  HEATER_TEMP: `${BASE_CHARACTERISTIC}25`,
  ACTIVE_LED_COLOR: `${BASE_CHARACTERISTIC}27`,
  HEATER_POWER: `${BASE_CHARACTERISTIC}28`,
  HEATER_DUTY: `${BASE_CHARACTERISTIC}29`,
  HEATER_VOLTAGE: `${BASE_CHARACTERISTIC}2a`,
  HEATER_CURRENT: `${BASE_CHARACTERISTIC}2b`,
  SAFETY_THERMAL_EST_TEMP: `${BASE_CHARACTERISTIC}2c`,
  HEATER_RESISTANCE: `${BASE_CHARACTERISTIC}2d`,
  BATTERY_CHARGE_CURRENT: `${BASE_CHARACTERISTIC}2e`,
  TOTAL_HEAT_CYCLES: `${BASE_CHARACTERISTIC}2f`,
  TOTAL_HEAT_CYCLE_TIME: `${BASE_CHARACTERISTIC}30`,
  BATTERY_CHARGE_STATE: `${BASE_CHARACTERISTIC}31`,
  BATTER_CHARGE_ELAPSED_TIME: `${BASE_CHARACTERISTIC}32`,
  BATTER_CHARGE_EST_TIME_TO_FULL: `${BASE_CHARACTERISTIC}33`,
  BATTERY_TEMP: `${BASE_CHARACTERISTIC}34`,
  UPTIME: `${BASE_CHARACTERISTIC}35`,
  INPUT_CURRENT: `${BASE_CHARACTERISTIC}37`,
  BATTERY_CAPACITY: `${BASE_CHARACTERISTIC}38`,
  BATTERY_CURRENT: `${BASE_CHARACTERISTIC}39`,
  APPROX_DABS_REMAINING: `${BASE_CHARACTERISTIC}3a`,
  DABS_PER_DAY: `${BASE_CHARACTERISTIC}3b`,
  RAW_HEATER_TEMP: `${BASE_CHARACTERISTIC}3c`,
  RAW_HEATER_TEMP_COMMAND: `${BASE_CHARACTERISTIC}3d`,
  BATTERY_CHARGE_SOURCE: `${BASE_CHARACTERISTIC}3e`,
  CHAMBER_TYPE: `${BASE_CHARACTERISTIC}3f`,
  PROFILE_CURRENT: `${BASE_CHARACTERISTIC}41`,
  STEALTH_MODE: `${BASE_CHARACTERISTIC}42`,
  UTC_TIME: `${BASE_CHARACTERISTIC}44`,
  TEMPERATURE_OVERRIDE: `${BASE_CHARACTERISTIC}45`,
  TIME_OVERRIDE: `${BASE_CHARACTERISTIC}46`,
  LANTERN_START: `${BASE_CHARACTERISTIC}4a`,
  LANTERN_COLOR: `${BASE_CHARACTERISTIC}48`,
  PROFILE: `${BASE_CHARACTERISTIC}61`,
  PROFILE_NAME: `${BASE_CHARACTERISTIC}62`,
  PROFILE_PREHEAT_TEMP: `${BASE_CHARACTERISTIC}63`,
  PROFILE_PREHEAT_TIME: `${BASE_CHARACTERISTIC}64`,
  PROFILE_COLOR: `${BASE_CHARACTERISTIC}65`,
  LED_BRIGHTNESS: `${BASE_CHARACTERISTIC}4b`,
  DEVICE_NAME: `${BASE_CHARACTERISTIC}4d`,
  DEVICE_BIRTHDAY: `${BASE_CHARACTERISTIC}4e`,
  TRIP_HEAT_CYCLES: `${BASE_CHARACTERISTIC}51`,
  TRIP_HEAT_CYCLE_TIME: `${BASE_CHARACTERISTIC}52`,
  HEAT_CYCLE_COUNT: `${BASE_CHARACTERISTIC}60`,
};

export const LoraxCharacteristicPathMap = {
  [Characteristic.EUID]: "/p/sys/bt/mac",
  [Characteristic.GIT_HASH]: "/p/sys/fw/gith",
  [Characteristic.BATTERY_SOC]: "/p/bat/soc",
  [Characteristic.BATTERY_VOLTAGE]: "/p/bat/volt",
  [Characteristic.OPERATING_STATE]: "/p/app/stat/id",
  [Characteristic.STATE_ELAPSED_TIME]: "/p/app/stat/elap",
  [Characteristic.STATE_TOTAL_TIME]: "/p/app/stat/tott",
  [Characteristic.HEATER_TEMP]: "/p/app/htr/temp",
  [Characteristic.ACTIVE_LED_COLOR]: "/p/app/led/aclr",
  [Characteristic.HEATER_POWER]: "/p/htr/pwr",
  [Characteristic.HEATER_DUTY]: "/p/htr/duty",
  [Characteristic.HEATER_VOLTAGE]: "/p/htr/vavg",
  [Characteristic.HEATER_CURRENT]: "/p/htr/iavg",
  [Characteristic.SAFETY_THERMAL_EST_TEMP]: "/p/htr/stet",
  [Characteristic.HEATER_RESISTANCE]: "/p/htr/res",
  [Characteristic.BATTERY_CHARGE_CURRENT]: "/p/bat/chg/iout",
  [Characteristic.TOTAL_HEAT_CYCLES]: "/p/app/odom/0/nc",
  [Characteristic.TOTAL_HEAT_CYCLE_TIME]: "/p/app/odom/0/tm",
  [Characteristic.BATTERY_CHARGE_STATE]: "/p/bat/chg/stat",
  [Characteristic.BATTER_CHARGE_ELAPSED_TIME]: "/p/bat/chg/elap",
  [Characteristic.BATTER_CHARGE_EST_TIME_TO_FULL]: "/p/bat/chg/etf",
  [Characteristic.BATTERY_TEMP]: "/p/bat/temp",
  [Characteristic.UPTIME]: "/p/sys/uptm",
  [Characteristic.BATTERY_CAPACITY]: "/p/bat/cap",
  [Characteristic.BATTERY_CURRENT]: "/p/bat/curr",
  [Characteristic.APPROX_DABS_REMAINING]: "/p/app/info/drem",
  [Characteristic.DABS_PER_DAY]: "/p/app/info/dpd",
  [Characteristic.RAW_HEATER_TEMP]: "/p/htr/temp",
  [Characteristic.RAW_HEATER_TEMP_COMMAND]: "/p/htr/tcmd",
  [Characteristic.BATTERY_CHARGE_SOURCE]: "/p/bat/chg/src",
  [Characteristic.CHAMBER_TYPE]: "/p/htr/chmt",
  [Characteristic.COMMAND]: "/p/app/mc",
  [Characteristic.PROFILE_CURRENT]: "/p/app/hcs",
  [Characteristic.STEALTH_MODE]: "/u/app/ui/stlm",
  [Characteristic.UTC_TIME]: "/p/sys/time",
  [Characteristic.TEMPERATURE_OVERRIDE]: "/p/app/tmpo",
  [Characteristic.TIME_OVERRIDE]: "/p/app/timo",
  [Characteristic.LANTERN_COLOR]: "/p/app/ltrn/colr",
  [Characteristic.LANTERN_START]: "/p/app/ltrn/cmd",
  [Characteristic.LED_BRIGHTNESS]: "/u/app/ui/lbrt",
  [Characteristic.DEVICE_NAME]: "/u/sys/name",
  [Characteristic.DEVICE_BIRTHDAY]: "/u/sys/bday",
  [Characteristic.TRIP_HEAT_CYCLES]: "/p/app/odom/1/nc",
  [Characteristic.TRIP_HEAT_CYCLE_TIME]: "/p/app/odom/1/tm",
  [Characteristic.HEAT_CYCLE_COUNT]: "/p/app/nhc",
  [MODEL_INFORMATION]: "/p/sys/hw/mdcd",
  [SERIAL_NUMBER]: "/p/sys/hw/ser",
  HARDWARE_VERSION: "/p/sys/hw/ver",
  [FIRMWARE_INFORMATION]: "/p/sys/fw/ver",
};

export const DeviceCommand = {
  IDLE: new Uint8Array([0, 0, 0, 64]),
  SHOW_VERSION: new Uint8Array([0, 0, 192, 64]),
  TEMP_SELECT_BEGIN: new Uint8Array([0, 0, 64, 64]),
  TEMP_SELECT_STOP: new Uint8Array([0, 0, 296, 64]),
  HEAT_CYCLE_BEGIN: new Uint8Array([0, 0, 224, 64]),
  BONDING: new Uint8Array([0, 0, 48, 65]),
};

export const DeviceProfile = {
  1: new Uint8Array([0, 0, 0, 0]),
  2: new Uint8Array([0, 0, 128, 63]),
  3: new Uint8Array([0, 0, 0, 64]),
  4: new Uint8Array([0, 0, 64, 64]),
};

export const DeviceProfileReverse = [
  new Uint8Array([0, 0, 0, 0]),
  new Uint8Array([0, 0, 128, 63]),
  new Uint8Array([0, 0, 0, 64]),
  new Uint8Array([0, 0, 64, 64]),
];

export enum ChamberType {
  None,
  Normal = 1,
  "3D" = 3,
}

export const ChamberTypeMap = {
  0: "None",
  1: "Normal",
  3: "3D",
};

export enum ChargeSource {
  USB,
  Wireless,
  None = 3,
}

export enum ColorMode {
  Preserve = 0,
  Static = 1,
  Breathing = 5,
  Rising = 6,
  Circling = 7,
  BrightBaseTwinkle = 8,
  Logo = 18,
  LogoBaseCircleFast = 19,
  LogoBaseCircleSlow = 20,
  FullCirclingSlow = 21,
}

export const LightCommands = {
  LANTERN_ON: new Uint8Array([1, 0, 0, 0]),
  LANTERN_OFF: new Uint8Array([0, 0, 0, 0]),
  LIGHT_DEFAULT: new Uint8Array([255, 255, 255, 0, ColorMode.Static]),
  LIGHT_NEUTRAL: new Uint8Array([255, 50, 0, ColorMode.Static]),
  LIGHT_QUERY_READY: new Uint8Array([
    0,
    255,
    50,
    0,
    ColorMode.LogoBaseCircleFast,
  ]),
  LIGHT_MARKED_READY: new Uint8Array([255, 50, ColorMode.Logo, 1]),
};

export enum PuffLightMode {
  QueryReady,
  MarkedReady,
  Default,
}

export async function switchProfile(profile: number) {
  await writeValue(
    Characteristic.PROFILE,
    new Uint8Array([profile - 1, 0, 0, 0])
  );
  await writeValue(Characteristic.PROFILE_CURRENT, DeviceProfile[profile]);
}

export async function loopProfiles() {
  const [, profileCurrentRaw] = await getValue(
    service,
    Characteristic.PROFILE_CURRENT
  );
  const profileCurrent = new Uint8Array(profileCurrentRaw.buffer);

  let profiles: Record<number, PuffcoProfile> = {};
  const startingIndex =
    DeviceProfileReverse.findIndex(
      (profile) =>
        profile.at(2) == profileCurrent.at(2) &&
        profile.at(3) == profileCurrent.at(3)
    ) + 1;
  for await (const idx of [0, 1, 2, 3]) {
    const key = (idx + startingIndex) % DeviceProfileReverse.length;
    await writeValue(Characteristic.PROFILE, new Uint8Array([key, 0, 0, 0]));
    const [, profileName] = await getValue(
      service,
      Characteristic.PROFILE_NAME,
      0
    );
    const name = decoder.decode(profileName);

    const [temperatureCall] = await getValue(
      service,
      Characteristic.PROFILE_PREHEAT_TEMP
    );
    const [timeCall] = await getValue(
      service,
      Characteristic.PROFILE_PREHEAT_TIME
    );
    const temp = Number(hexToFloat(temperatureCall).toFixed(0));
    const time = Number(hexToFloat(timeCall).toFixed(0));

    console.log(`Profile #${key + 1} - ${name} - ${temp} - ${time}`);
    profiles[key + 1] = {
      name,
      temp,
      time: millisToMinutesAndSeconds(time * 1000),
    };
  }

  return profiles;
}

export async function setLightMode(mode: PuffLightMode) {
  switch (mode) {
    case PuffLightMode.QueryReady: {
      await writeValue(
        Characteristic.LANTERN_COLOR,
        LightCommands.LIGHT_QUERY_READY
      );
      await writeValue(Characteristic.LANTERN_START, LightCommands.LANTERN_ON);
      break;
    }
    case PuffLightMode.MarkedReady: {
      await writeValue(
        Characteristic.LANTERN_COLOR,
        LightCommands.LIGHT_MARKED_READY
      );
      await writeValue(Characteristic.LANTERN_START, LightCommands.LANTERN_ON);
      break;
    }
    case PuffLightMode.Default: {
      await writeValue(Characteristic.LANTERN_START, LightCommands.LANTERN_OFF);
      await writeValue(
        Characteristic.LANTERN_COLOR,
        LightCommands.LIGHT_NEUTRAL
      );
      break;
    }
  }
}

export async function setBrightness(brightness: number) {
  await writeValue(Characteristic.LANTERN_COLOR, LightCommands.LIGHT_DEFAULT);
  await writeValue(Characteristic.LANTERN_START, LightCommands.LANTERN_ON);
  brightness = Number((((brightness - 0) * (255 - 0)) / 100).toFixed(0));
  await writeValue(
    Characteristic.LED_BRIGHTNESS,
    new Uint8Array(new Array(4).fill(0).map(() => brightness))
  );
  await new Promise((resolve) => setTimeout(() => resolve(true), 1000));
  await writeValue(Characteristic.LANTERN_START, LightCommands.LANTERN_OFF);
}

export async function startConnection() {
  try {
    try {
      device = await navigator.bluetooth.requestDevice({
        filters: [
          {
            services: [SERVICE],
          },
          {
            services: [LORAX_SERVICE],
          },
        ],
        optionalServices: [
          MODEL_SERVICE,
          SILLABS_OTA_SERVICE,
          LORAX_SERVICE,
          PUP_SERVICE,
        ],
      });
    } catch (error) {
      throw error;
    }

    server = await device.gatt.connect();

    const primaryServices = await server.getPrimaryServices();
    isLorax = !!primaryServices.find(
      (service) => service.uuid == LORAX_SERVICE
    );

    if (isLorax)
      throw {
        code: "ac_firmware",
      };

    service = await server.getPrimaryService(isLorax ? LORAX_SERVICE : SERVICE);

    device.addEventListener("gattserverdisconnected", () => {
      console.log("Gatt server disconnected");
    });

    if (!isLorax) modelService = await server.getPrimaryService(MODEL_SERVICE);

    // DEBUG ONLY
    if (typeof window != "undefined") window["modelService"] = modelService;
    if (typeof window != "undefined") window["server"] = server;
    if (typeof window != "undefined") window["service"] = service;
    if (typeof window != "undefined") window["LoraxCommands"] = LoraxCommands;
    window["LoraxCharacteristic"] = LoraxCharacteristic;
    if (typeof window != "undefined") window["Characteristic"] = Characteristic;
    if (typeof window != "undefined") window["getValue"] = getValue;
    if (typeof window != "undefined") window["unpack"] = unpack;
    if (typeof window != "undefined") window["pack"] = pack;
    if (typeof window != "undefined") window["writeValue"] = writeValue;
    if (typeof window != "undefined") window["hexToFloat"] = hexToFloat;
    if (typeof window != "undefined")
      window["decimalToHexString"] = decimalToHexString;
    if (typeof window != "undefined") window["sendCommand"] = sendCommand;
    if (typeof window != "undefined") window["DeviceCommand"] = DeviceCommand;
    if (typeof window != "undefined") window["setBrightness"] = setBrightness;
    if (typeof window != "undefined") window["setLightMode"] = setLightMode;
    if (typeof window != "undefined")
      window["constructLoraxCommand"] = constructLoraxCommand;
    if (typeof window != "undefined")
      window["sendLoraxCommand"] = sendLoraxCommand;
    if (typeof window != "undefined")
      window["writeLoraxCommand"] = writeLoraxCommand;

    if (!isLorax) {
      const [, model] = await getValue(modelService, MODEL_INFORMATION, 0);
      const [, firmware] = await getValue(
        modelService,
        FIRMWARE_INFORMATION,
        0
      );
      deviceFirmware = decoder.decode(firmware);
      deviceModel = decoder.decode(model);

      setTimeout(async () => {
        const diagData: DiagData = {
          session_id: gateway.session_id,
          device_parameters: {
            name: device.name,
            firmware: deviceFirmware,
            model: deviceModel,
          },
        };

        try {
          diagData.device_services = await Promise.all(
            (
              await server.getPrimaryServices()
            ).map(async (service) => ({
              uuid: service.uuid,
              characteristicCount: (await service.getCharacteristics()).length,
            }))
          );
          diagData.device_parameters.loraxService = await server
            .getPrimaryService(LORAX_SERVICE)
            .then(() => true)
            .catch(() => false);
          diagData.device_parameters.pupService = await server
            .getPrimaryService(PUP_SERVICE)
            .then(() => true)
            .catch(() => false);
        } catch (error) {}

        trackDiags(diagData);
      }, 100);
    }

    if (isLorax) {
      const reply = await service.getCharacteristic(LoraxCharacteristic.REPLY);
      reply.addEventListener("characteristicvaluechanged", async (ev) => {
        const {
          value: { buffer },
        }: { value: DataView } = ev.target as any;
        const data = processLoraxReply(buffer);
        const msg = loraxMessages.get(data.seq);
        msg.response = { data: data.data, error: !!data.error };

        switch (msg.op) {
          case LoraxCommands.GET_ACCESS_SEED: {
            const arr = Buffer.from((data.data as Uint8Array).buffer);
            console.log("got auth", arr);

            const decodedHandshake = convertFromHex(
              LORAX_HANDSHAKE_KEY.toString("hex")
            );

            const newSeed = new Uint8Array(32);
            for (let i = 0; i < 16; ++i) {
              newSeed[i] = decodedHandshake.charCodeAt(i);
              newSeed[i + 16] = data.data[i];
            }

            const newKey = convertHexStringToNumArray(
              createHash("sha256").update(newSeed).digest("hex")
            ).slice(0, 16);

            await sendLoraxCommand(LoraxCommands.UNLOCK_ACCESS, newKey);

            await getLoraxValueShort(
              LoraxCharacteristicPathMap[FIRMWARE_INFORMATION]
            );
            await getLoraxValueShort(LoraxCharacteristicPathMap[SERIAL_NUMBER]);
            await getLoraxValueShort(
              LoraxCharacteristicPathMap[MODEL_INFORMATION]
            );
            await getLoraxValueShort(
              LoraxCharacteristicPathMap[Characteristic.GIT_HASH]
            );
            await getLoraxValueShort(
              LoraxCharacteristicPathMap[Characteristic.DEVICE_BIRTHDAY]
            );
            await getLoraxValueShort(
              LoraxCharacteristicPathMap[Characteristic.EUID]
            );
            await getLoraxValueShort(
              LoraxCharacteristicPathMap[Characteristic.UTC_TIME]
            );
            await getLoraxValueShort(
              LoraxCharacteristicPathMap[Characteristic.DEVICE_NAME]
            );

            await sendLoraxValueShort(
              LoraxCharacteristicPathMap[Characteristic.COMMAND],
              Buffer.from(DeviceCommand.HEAT_CYCLE_BEGIN)
            );

            break;
          }

          case LoraxCommands.UNLOCK_ACCESS: {
            if (msg.response.error) return;
            console.log("Authenticated with Lorax protocol");

            break;
          }

          case LoraxCommands.READ: {
            switch (msg.path) {
              default:
                console.log("Got read from lorax", data, msg);
                break;
            }

            break;
          }

          case LoraxCommands.READ_SHORT: {
            switch (msg.path) {
              case LoraxCharacteristicPathMap[FIRMWARE_INFORMATION]:
                const version = data.data.readUInt8(0);
                console.log("Using API version", version);
                break;
              case LoraxCharacteristicPathMap[SERIAL_NUMBER]:
                console.log("serial", data.data.toString());
                break;
              case LoraxCharacteristicPathMap[Characteristic.DEVICE_NAME]:
                console.log("device name", data.data.toString());
                break;
              case LoraxCharacteristicPathMap[Characteristic.GIT_HASH]:
                console.log("git hash", data.data.toString());
                break;
              case LoraxCharacteristicPathMap[Characteristic.DEVICE_BIRTHDAY]:
                console.log("birthday", data.data);
                break;
              case LoraxCharacteristicPathMap[MODEL_INFORMATION]:
                console.log("model", data.data);
                break;
              case LoraxCharacteristicPathMap[Characteristic.EUID]:
                console.log("euid", intArrayToMacAddress(data.data));
                break;
              case LoraxCharacteristicPathMap[Characteristic.UTC_TIME]:
                console.log("utc time", data.data);
                break;

              default:
                console.log("Got read short from lorax", data, msg);
                break;
            }

            break;
          }

          case LoraxCommands.GET_LIMITS: {
            if (data.data) {
              console.log("Limits raw", data.data);
              loraxLimits.maxPayload = data.data.readUInt8(0);
              loraxLimits.maxFiles = data.data.readUInt16LE(1);
              loraxLimits.maxCommands = data.data.readUInt16LE(2);

              console.log("Got lorax limits", loraxLimits);
            }

            break;
          }

          default:
            console.log("Got reply from lorax", data, msg);
            break;
        }
      });
      reply.startNotifications();

      const event = await service.getCharacteristic(LoraxCharacteristic.EVENT);
      event.addEventListener("characteristicvaluechanged", (ev) => {
        const {
          value: { buffer },
        }: { value: DataView } = ev.target as any;
        const data = processLoraxReply(buffer);
        console.log("Got event from lorax", data, (ev.target as any).value);
      });
      event.startNotifications();

      sendLoraxCommand(LoraxCommands.GET_LIMITS, null);
      sendLoraxCommand(LoraxCommands.GET_ACCESS_SEED, null);
    } else {
      const accessSeedKey = await service.getCharacteristic(
        Characteristic.ACCESS_KEY
      );
      const value = await accessSeedKey.readValue();

      const decodedKey = new Uint8Array(16);
      for (let i = 0; i < 16; i++) {
        decodedKey[i] = value.getUint8(i);
      }

      const decodedHandshake = convertFromHex(HANDSHAKE_KEY.toString("hex"));

      const newSeed = new Uint8Array(32);
      for (let i = 0; i < 16; ++i) {
        newSeed[i] = decodedHandshake.charCodeAt(i);
        newSeed[i + 16] = decodedKey[i];
      }

      const newKey = convertHexStringToNumArray(
        createHash("sha256").update(newSeed).digest("hex")
      ).slice(0, 16);
      await accessSeedKey.writeValue(Buffer.from(newKey));
      profiles = await loopProfiles();

      try {
        const [, gitHash] = await getValue(service, Characteristic.GIT_HASH, 0);
        const [, deviceUptime] = await getValue(
          service,
          Characteristic.UPTIME,
          0
        );
        const [, deviceUtcTime] = await getValue(
          service,
          Characteristic.UTC_TIME,
          0
        );
        const [, deviceDob] = await getValue(
          service,
          Characteristic.DEVICE_BIRTHDAY,
          0
        );
        const [, batteryCapacity] = await getValue(
          service,
          Characteristic.BATTERY_CAPACITY,
          0
        );
        const [, euid] = await getValue(service, Characteristic.EUID, 0);
        const [, chamberType] = await getValue(
          service,
          Characteristic.CHAMBER_TYPE,
          0
        );

        const loraxService = await server
          .getPrimaryService(LORAX_SERVICE)
          .then(() => true)
          .catch(() => false);
        const pupService = await server
          .getPrimaryService(PUP_SERVICE)
          .then(() => true)
          .catch(() => false);

        const diagData: DiagData = {
          session_id: gateway.session_id,
          device_services: await Promise.all(
            (
              await server.getPrimaryServices()
            ).map(async (service) => ({
              uuid: service.uuid,
              characteristicCount: (await service.getCharacteristics()).length,
            }))
          ),
          device_profiles: profiles,
          device_parameters: {
            name: device.name,
            firmware: deviceFirmware,
            model: deviceModel,
            authenticated: true,
            loraxService,
            pupService,
            hash: decoder.decode(gitHash),
            uptime: unpack(new Uint8Array(deviceUptime.buffer), { bits: 32 }),
            utc: unpack(new Uint8Array(deviceUtcTime.buffer), { bits: 32 }),
            batteryCapacity: unpack(new Uint8Array(batteryCapacity.buffer), {
              bits: 16,
            }),
            mac: intArrayToMacAddress(new Uint8Array(euid.buffer)),
            chamberType: Number(
              unpack(new Uint8Array(chamberType.buffer), { bits: 8 })
            ),
            dob: Number(unpack(new Uint8Array(deviceDob.buffer), { bits: 32 })),
          },
        };

        trackDiags(diagData);
      } catch (error) {
        console.error(`Failed to track diags: ${error}`);
      }
    }

    return { device, profiles };
  } catch (error) {
    throw error;
  }
}

export async function disconnectBluetooth() {
  if (!server || !poller) return;
  poller.emit("stop");
  server.disconnect();
}

export async function sendCommand(command: Uint8Array) {
  if (!service) return;
  await writeValue(Characteristic.COMMAND, command);
}

export async function sendLoraxCommand(
  op: number,
  data: Uint8Array,
  path?: string
) {
  if (!service) return;

  const off = Math.pow(2, 16) - 1;
  lastLoraxSequenceId = (lastLoraxSequenceId + 1) % off;
  const message = constructLoraxCommand(op, lastLoraxSequenceId, data);
  loraxMessages.set(lastLoraxSequenceId, {
    op,
    seq: lastLoraxSequenceId,
    request: data,
    path,
  });

  await writeLoraxCommand(message);
}

export async function updateDeviceDob(date: Date) {
  await writeValue(
    Characteristic.DEVICE_BIRTHDAY,
    new Uint8Array(pack(date.getTime() / 1000, { bits: 32 }))
  );
}

export async function updateDeviceName(name: string) {
  await writeValue(Characteristic.DEVICE_NAME, new TextEncoder().encode(name));
}

export async function writeValue(characteristic: string, value: Uint8Array) {
  if (!service) return;

  const char = await service.getCharacteristic(characteristic);
  await char.writeValue(Buffer.from(value));
}

export async function writeLoraxCommand(message: Buffer) {
  if (!service) return;

  const char = await service.getCharacteristic(LoraxCharacteristic.COMMAND);

  return await char.writeValueWithoutResponse(message);
}

export async function startPolling(device?: BluetoothDevice) {
  poller = new EventEmitter();
  if (!service) return;

  const initState: Partial<GatewayMemberDeviceState> = {};
  const deviceInfo: Partial<DeviceInformation> = {};

  await new Promise((resolve) => setTimeout(() => resolve(true), 200));

  const [, initDeviceModal] = await getValue(
    modelService,
    MODEL_INFORMATION,
    0
  );
  initState.deviceModel = decoder.decode(initDeviceModal);
  deviceInfo.model = initState.deviceModel;

  const [, initDeviceFirmware] = await getValue(
    modelService,
    FIRMWARE_INFORMATION,
    0
  );
  const [, initGitHash] = await getValue(service, Characteristic.GIT_HASH, 0);
  deviceInfo.firmware = decoder.decode(initDeviceFirmware);
  deviceInfo.hash = decoder.decode(initGitHash);

  const [initTemperature] = await getValue(service, Characteristic.HEATER_TEMP);
  initState.temperature = Number(hexToFloat(initTemperature).toFixed(0));

  const [, initActiveColor] = await getValue(
    service,
    Characteristic.ACTIVE_LED_COLOR
  );
  initState.activeColor = {
    r: initActiveColor.getUint8(0),
    g: initActiveColor.getUint8(1),
    b: initActiveColor.getUint8(2),
  };

  const [initBrightness] = await getValue(
    service,
    Characteristic.LED_BRIGHTNESS,
    1
  );
  initState.brightness = Number(
    (((Number(initBrightness) - 0) / (255 - 0)) * 100).toFixed(0)
  );

  const [initBattery] = await getValue(service, Characteristic.BATTERY_SOC);
  initState.battery = Number(hexToFloat(initBattery).toFixed(0));

  const [initStateState] = await getValue(
    service,
    Characteristic.OPERATING_STATE
  );
  initState.state = hexToFloat(initStateState);

  const [initChargeSource] = await getValue(
    service,
    Characteristic.BATTERY_CHARGE_SOURCE
  );
  initState.chargeSource = Number(hexToFloat(initChargeSource).toFixed(0));

  const [, initTotalDabs] = await getValue(
    service,
    Characteristic.TOTAL_HEAT_CYCLES
  );
  const dabsString =
    decimalToHexString(initTotalDabs.getUint8(0)).toString() +
    decimalToHexString(initTotalDabs.getUint8(1)).toString() +
    decimalToHexString(initTotalDabs.getUint8(2)).toString() +
    decimalToHexString(initTotalDabs.getUint8(3)).toString();
  initState.totalDabs = Number(hexToFloat(flipHexString("0x" + dabsString, 8)));
  deviceInfo.totalDabs = initState.totalDabs;

  const [, initDeviceName] = await getValue(
    service,
    Characteristic.DEVICE_NAME,
    0
  );
  if (initDeviceName.byteLength == 0 && device) {
    await writeValue(Characteristic.DEVICE_NAME, encoder.encode(device.name));
    initState.deviceName = device.name;
  } else {
    initState.deviceName = decoder.decode(initDeviceName);
  }
  deviceInfo.name = initState.deviceName;

  const [, initProfileName] = await getValue(
    service,
    Characteristic.PROFILE_NAME,
    0
  );
  const [temperatureCall] = await getValue(
    service,
    Characteristic.PROFILE_PREHEAT_TEMP
  );
  const [timeCall] = await getValue(
    service,
    Characteristic.PROFILE_PREHEAT_TIME
  );
  const temp = Number(hexToFloat(temperatureCall).toFixed(0));
  const time = Number(hexToFloat(timeCall).toFixed(0));
  initState.profile = {
    name: decoder.decode(initProfileName),
    temp,
    time: millisToMinutesAndSeconds(time * 1000),
  };

  const [, initDeviceBirthday] = await getValue(
    service,
    Characteristic.DEVICE_BIRTHDAY
  );
  deviceInfo.dob = Number(
    unpack(new Uint8Array(initDeviceBirthday.buffer), { bits: 32 }).toString()
  );

  const [, initEuid] = await getValue(service, Characteristic.EUID);
  deviceInfo.mac = intArrayToMacAddress(new Uint8Array(initEuid.buffer));
  initState.deviceMac = deviceInfo.mac;

  const [, initChamberType] = await getValue(
    service,
    Characteristic.CHAMBER_TYPE,
    0
  );
  initState.chamberType = unpack(new Uint8Array(initChamberType.buffer), {
    bits: 8,
  });

  const chargingPoll = await gattPoller(
    service,
    Characteristic.BATTERY_CHARGE_SOURCE,
    4,
    4300
  );
  chargingPoll.on("change", (data, raw) => {
    poller.emit("data", { chargeSource: Number(hexToFloat(data).toFixed(0)) });
  });

  const batteryPoll = await gattPoller(
    service,
    Characteristic.BATTERY_SOC,
    4,
    9200
  );
  batteryPoll.on("change", (data) => {
    poller.emit("data", { battery: Number(hexToFloat(data).toFixed(0)) });
  });

  const operatingState = await gattPoller(
    service,
    Characteristic.OPERATING_STATE,
    4,
    1000
  );
  operatingState.on("change", (data) => {
    poller.emit("data", { state: hexToFloat(data) });
  });

  const chamberType = await gattPoller(
    service,
    Characteristic.CHAMBER_TYPE,
    1,
    1600
  );
  chamberType.on("change", (data, raw) => {
    poller.emit("data", {
      chamberType: unpack(new Uint8Array(raw.buffer), { bits: 8 }),
    });
  });

  const aciveLEDPoll = await gattPoller(
    service,
    Characteristic.ACTIVE_LED_COLOR,
    4,
    1050
  );
  let currentLedColor: { r: number; g: number; b: number };
  aciveLEDPoll.on("data", (data, raw: Buffer) => {
    const r = (raw as any).getUint8(0);
    const g = (raw as any).getUint8(1);
    const b = (raw as any).getUint8(2);
    if (JSON.stringify(currentLedColor) != JSON.stringify({ r, g, b }))
      poller.emit("data", { activeColor: { r, g, b } });
    currentLedColor = { r, g, b };
  });

  const brightnessPoll = await gattPoller(
    service,
    Characteristic.LED_BRIGHTNESS,
    1,
    9000
  );
  brightnessPoll.on("change", (data) => {
    poller.emit("data", {
      brightness: Number(
        (((Number(initBrightness) - 0) / (255 - 0)) * 100).toFixed(0)
      ),
    });
  });

  const totalDabsPoll = await gattPoller(
    service,
    Characteristic.TOTAL_HEAT_CYCLES,
    1,
    7200
  );
  totalDabsPoll.on("data", (data, raw) => {
    const dabsString =
      decimalToHexString(raw.getUint8(0)).toString() +
      decimalToHexString(raw.getUint8(1)).toString() +
      decimalToHexString(raw.getUint8(2)).toString() +
      decimalToHexString(raw.getUint8(3)).toString();
    const float = hexToFloat(flipHexString("0x" + dabsString, 8));
    poller.emit("data", { totalDabs: float });
  });

  let lastTemp: number;
  const tempPoll = await gattPoller(
    service,
    Characteristic.HEATER_TEMP,
    4,
    1000
  );
  tempPoll.on("data", async (data) => {
    const conv = Number(hexToFloat(data).toFixed(0));
    if (lastTemp != conv && conv < 1000 && conv > 1)
      poller.emit("data", { temperature: conv });
    lastTemp = conv;
  });

  let lastIndex: number;
  const currentProfilePoll = await gattPoller(
    service,
    Characteristic.PROFILE_CURRENT,
    0,
    1010
  );
  currentProfilePoll.on("data", async (data, raw) => {
    const profileCurrent = new Uint8Array(raw.buffer);
    const profileIndex =
      DeviceProfileReverse.findIndex(
        (profile) =>
          profile.at(2) == profileCurrent.at(2) &&
          profile.at(3) == profileCurrent.at(3)
      ) + 1;
    if (profileIndex != lastIndex)
      poller.emit("data", {
        profile: profiles[profileIndex],
      });
    lastIndex = profileIndex;
  });

  const deviceNamePoll = await gattPoller(
    service,
    Characteristic.DEVICE_NAME,
    1,
    65000
  );
  deviceNamePoll.on("change", (data, raw) => {
    const name = decoder.decode(raw);
    poller.emit("data", { deviceName: name });
  });

  poller.on("stop", () => {
    chargingPoll.emit("stop");
    batteryPoll.emit("stop");
    operatingState.emit("stop");
    chamberType.emit("stop");
    aciveLEDPoll.emit("stop");
    brightnessPoll.emit("stop");
    totalDabsPoll.emit("stop");
    tempPoll.emit("stop");
    currentProfilePoll.emit("stop");
    deviceNamePoll.emit("stop");
    poller.removeAllListeners();
  });

  return { poller, initState, deviceInfo };
}
