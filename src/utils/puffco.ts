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
  hexToFloat,
  constructLoraxCommand,
  processLoraxReply,
  intArrayToMacAddress,
  readCmd,
  readShortCmd,
  writeCmd,
  writeShortCmd,
  numbersToLetters,
  convertHexArrayToNumArray,
  watchCmd,
} from "./functions";
import { DeviceInformation, DiagData } from "../types/api";
import { trackDiags } from "./hash";
import { LoraxLimits, LoraxMessage, PuffcoProfile } from "../types/puffco";
import { gateway } from "./gateway";

export const SILLABS_OTA_SERVICE = "1d14d6ee-fd63-4fa1-bfa4-8f47b42119f0";
export const LORAX_SERVICE = "e276967f-ea8a-478a-a92e-d78f5dd15dd5";
export const PUP_SERVICE = "420b9b40-457d-4abe-a3bf-71609d79581b";
export const SERVICE = "06caf9c0-74d3-454f-9be9-e30cd999c17a";
export const BASE_CHARACTERISTIC = `f9a98c15-c651-4f34-b656-d100bf5800`;
export const HANDSHAKE_KEY = Buffer.from("FUrZc0WilhUBteT2JlCc+A==", "base64");
export const LORAX_HANDSHAKE_KEY = Buffer.from(
  "ZMZFYlbyb1scoSc3pd1x+w==",
  "base64"
);

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
  MODEL_SERVICE: "0000180a-0000-1000-8000-00805f9b34fb",
  HARDWARE_MODEL: "00002a24-0000-1000-8000-00805f9b34fb",
  FIRMWARE_VERSION: "00002a28-0000-1000-8000-00805f9b34fb",
  SERIAL_NUMBER: "00002a25-0000-1000-8000-00805f9b34fb",
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
  [Characteristic.STEALTH_MODE]: "/u/app/ui/stlm",
  [Characteristic.UTC_TIME]: "/p/sys/time",
  [Characteristic.TEMPERATURE_OVERRIDE]: "/p/app/tmpo",
  [Characteristic.TIME_OVERRIDE]: "/p/app/timo",
  [Characteristic.LANTERN_COLOR]: "/p/app/ltrn/colr",
  [Characteristic.LANTERN_START]: "/p/app/ltrn/cmd",
  [Characteristic.PROFILE]: "/p/app/ltrn/cmd",
  [Characteristic.PROFILE_CURRENT]: "/p/app/hcs",
  [Characteristic.LED_BRIGHTNESS]: "/u/app/ui/lbrt",
  [Characteristic.DEVICE_NAME]: "/u/sys/name",
  [Characteristic.DEVICE_BIRTHDAY]: "/u/sys/bday",
  [Characteristic.TRIP_HEAT_CYCLES]: "/p/app/odom/1/nc",
  [Characteristic.TRIP_HEAT_CYCLE_TIME]: "/p/app/odom/1/tm",
  [Characteristic.HEAT_CYCLE_COUNT]: "/p/app/nhc",
  [Characteristic.HARDWARE_MODEL]: "/p/sys/hw/mdcd",
  [Characteristic.SERIAL_NUMBER]: "/p/sys/hw/ser",
  HARDWARE_VERSION: "/p/sys/hw/ver",
  [Characteristic.FIRMWARE_VERSION]: "/p/sys/fw/ver",
};

export const DynamicLoraxCharacteristics = {
  [Characteristic.PROFILE_NAME]: (id: number) => `/u/app/hc/${id}/name`,
  [Characteristic.PROFILE_PREHEAT_TEMP]: (id: number) => `/u/app/hc/${id}/temp`,
  [Characteristic.PROFILE_PREHEAT_TIME]: (id: number) => `/u/app/hc/${id}/time`,
};

export const DeviceCommand = {
  IDLE: new Uint8Array([0, 0, 0, 64]),
  SHOW_VERSION: new Uint8Array([0, 0, 192, 64]),
  TEMP_SELECT_BEGIN: new Uint8Array([0, 0, 64, 64]),
  TEMP_SELECT_STOP: new Uint8Array([0, 0, 296, 64]),
  HEAT_CYCLE_BEGIN: {
    LORAX: new Uint8Array([7]),
    OLD: new Uint8Array([0, 0, 224, 64]),
  },
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

export interface Device {
  device: BluetoothDevice;

  server: BluetoothRemoteGATTServer;
  service: BluetoothRemoteGATTService;
  modelService?: BluetoothRemoteGATTService;

  loraxReply?: BluetoothRemoteGATTCharacteristic;
  loraxEvent?: BluetoothRemoteGATTCharacteristic;

  poller: EventEmitter;
  profiles: Record<number, PuffcoProfile>;

  lastLoraxSequenceId: number;
  loraxMessages: Map<number, LoraxMessage>;
  loraxLimits: LoraxLimits;

  isLorax: boolean;

  gitHash: string;
  deviceModel: number;
  deviceFirmware: string;
  deviceSerialNumber: string;
  deviceMacAddress: string;
  currentProfileId: number;
}

export class Device extends EventEmitter {
  constructor() {
    super();
    this.lastLoraxSequenceId = 0;
    this.loraxLimits = { maxCommands: 0, maxFiles: 0, maxPayload: 0 };
    this.loraxMessages = new Map();
  }

  init(): Promise<{
    profiles: Record<number, PuffcoProfile>;
    device: BluetoothDevice;
  }> {
    return new Promise(async (resolve, reject) => {
      try {
        try {
          this.device = await navigator.bluetooth.requestDevice({
            filters: [
              {
                services: [SERVICE],
              },
              {
                services: [LORAX_SERVICE],
              },
            ],
            optionalServices: [
              Characteristic.MODEL_SERVICE,
              SILLABS_OTA_SERVICE,
              LORAX_SERVICE,
              PUP_SERVICE,
            ],
          });
        } catch (error) {
          reject(error);
        }

        this.server = await this.device.gatt.connect();

        const primaryServices = await this.server.getPrimaryServices();
        this.isLorax = !!primaryServices.find(
          (service) => service.uuid == LORAX_SERVICE
        );

        // if (this.isLorax)
        //   reject({
        //     code: "ac_firmware",
        //   });

        this.service = await this.server.getPrimaryService(
          this.isLorax ? LORAX_SERVICE : SERVICE
        );

        this.device.addEventListener("gattserverdisconnected", () => {
          console.log("Gatt server disconnected");
        });

        if (!this.isLorax)
          this.modelService = await this.server.getPrimaryService(
            Characteristic.MODEL_SERVICE
          );

        // DEBUG ONLY
        if (typeof window != "undefined")
          window["modelService"] = this.modelService;
        if (typeof window != "undefined") window["server"] = this.server;
        if (typeof window != "undefined") window["service"] = this.service;
        if (typeof window != "undefined")
          window["LoraxCommands"] = LoraxCommands;
        window["LoraxCharacteristic"] = LoraxCharacteristic;
        if (typeof window != "undefined")
          window["Characteristic"] = Characteristic;
        if (typeof window != "undefined") window["getValue"] = this.getValue;
        if (typeof window != "undefined") window["unpack"] = unpack;
        if (typeof window != "undefined") window["pack"] = pack;
        if (typeof window != "undefined") window["hexToFloat"] = hexToFloat;
        if (typeof window != "undefined")
          window["decimalToHexString"] = decimalToHexString;
        if (typeof window != "undefined")
          window["sendCommand"] = this.sendCommand;
        if (typeof window != "undefined")
          window["DeviceCommand"] = DeviceCommand;
        if (typeof window != "undefined")
          window["setBrightness"] = this.setBrightness;
        if (typeof window != "undefined")
          window["setLightMode"] = this.setLightMode;
        if (typeof window != "undefined")
          window["constructLoraxCommand"] = constructLoraxCommand;
        if (typeof window != "undefined")
          window["sendLoraxCommand"] = this.sendLoraxCommand;
        if (typeof window != "undefined")
          window["writeLoraxCommand"] = this.writeLoraxCommand;

        if (!this.isLorax) {
          const modelRaw = await this.getValue(Characteristic.HARDWARE_MODEL);
          this.deviceModel = modelRaw.readUint8(0);

          const firmwareRaw = await this.getValue(
            Characteristic.FIRMWARE_VERSION
          );
          this.deviceFirmware = numbersToLetters(
            new Uint8Array(firmwareRaw.buffer).reduce(
              (prev, curr) => prev + curr
            )
          ); // Map this to firmwares later

          setTimeout(async () => {
            const diagData: DiagData = {
              session_id: gateway.session_id,
              device_parameters: {
                name: this.device.name,
                firmware: this.deviceFirmware,
                model: this.deviceModel,
              },
            };

            try {
              diagData.device_services = await Promise.all(
                (
                  await this.server.getPrimaryServices()
                ).map(async (service) => ({
                  uuid: service.uuid,
                  characteristicCount: (
                    await service.getCharacteristics()
                  ).length,
                }))
              );
              diagData.device_parameters.loraxService = await this.server
                .getPrimaryService(LORAX_SERVICE)
                .then(() => true)
                .catch(() => false);
              diagData.device_parameters.pupService = await this.server
                .getPrimaryService(PUP_SERVICE)
                .then(() => true)
                .catch(() => false);
            } catch (error) {}

            trackDiags(diagData);
          }, 100);
        }

        if (this.isLorax) {
          await new Promise(async (upperResolve, upperReject) => {
            this.loraxReply = await this.service.getCharacteristic(
              LoraxCharacteristic.REPLY
            );
            this.loraxReply.addEventListener(
              "characteristicvaluechanged",
              async (ev) => {
                const {
                  value: { buffer },
                }: { value: DataView } = ev.target as any;
                const data = processLoraxReply(buffer);
                const msg = this.loraxMessages.get(data.seq);
                msg.response = { data: data.data, error: !!data.error };

                switch (msg.op) {
                  case LoraxCommands.GET_ACCESS_SEED: {
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

                    await this.sendLoraxCommand(
                      LoraxCommands.UNLOCK_ACCESS,
                      newKey
                    );

                    break;
                  }

                  case LoraxCommands.UNLOCK_ACCESS: {
                    if (msg.response.error) return;
                    console.log("Authenticated with Lorax protocol");

                    upperResolve(true);

                    break;
                  }

                  case LoraxCommands.GET_LIMITS: {
                    if (data.data) {
                      this.loraxLimits.maxPayload = data.data.readUInt8(0);
                      this.loraxLimits.maxFiles = data.data.readUInt16LE(1);
                      this.loraxLimits.maxCommands = data.data.readUInt16LE(2);

                      console.log("Lorax Limits:", this.loraxLimits);
                      this.sendLoraxCommand(
                        LoraxCommands.GET_ACCESS_SEED,
                        null
                      );
                    }

                    break;
                  }

                  case LoraxCommands.WATCH: {
                    console.log("watch reply", data, msg);

                    break;
                  }
                }
              }
            );
            this.loraxReply.startNotifications();

            this.loraxEvent = await this.service.getCharacteristic(
              LoraxCharacteristic.EVENT
            );

            this.loraxEvent.addEventListener(
              "characteristicvaluechanged",
              (ev) => {
                const {
                  value: { buffer },
                }: { value: DataView } = ev.target as any;
                console.log("event", buffer);
              }
            );
            this.loraxEvent.startNotifications();

            this.sendLoraxCommand(LoraxCommands.GET_LIMITS, null);
          });

          const modelRaw = await this.getValue(Characteristic.HARDWARE_MODEL);
          this.deviceModel = modelRaw.readUInt8(0);

          const firmwareRaw = await this.getValue(
            Characteristic.FIRMWARE_VERSION
          );
          this.deviceFirmware = numbersToLetters(
            new Uint8Array(firmwareRaw.buffer).reduce(
              (prev, curr) => prev + curr
            )
          ); // Map this to firmwares later

          const diagData: DiagData = {
            session_id: gateway.session_id,
            device_parameters: {
              name: this.device.name,
              firmware: this.deviceFirmware,
              model: this.deviceModel,
            },
          };

          console.log(diagData);

          try {
            diagData.device_services = await Promise.all(
              (
                await this.server.getPrimaryServices()
              ).map(async (service) => ({
                uuid: service.uuid,
                characteristicCount: (
                  await service.getCharacteristics()
                ).length,
              }))
            );
            diagData.device_parameters.loraxService = await this.server
              .getPrimaryService(LORAX_SERVICE)
              .then(() => true)
              .catch(() => false);
            diagData.device_parameters.pupService = await this.server
              .getPrimaryService(PUP_SERVICE)
              .then(() => true)
              .catch(() => false);
          } catch (error) {}
          // trackDiags(diagData);

          this.profiles = await this.loraxProfiles();
        } else {
          const accessSeedKey = await this.service.getCharacteristic(
            Characteristic.ACCESS_KEY
          );
          const value = await accessSeedKey.readValue();

          const decodedKey = new Uint8Array(16);
          for (let i = 0; i < 16; i++) decodedKey[i] = value.getUint8(i);

          const decodedHandshake = convertFromHex(
            HANDSHAKE_KEY.toString("hex")
          );

          const newSeed = new Uint8Array(32);
          for (let i = 0; i < 16; ++i) {
            newSeed[i] = decodedHandshake.charCodeAt(i);
            newSeed[i + 16] = decodedKey[i];
          }

          const newKey = convertHexStringToNumArray(
            createHash("sha256").update(newSeed).digest("hex")
          ).slice(0, 16);
          await accessSeedKey.writeValue(Buffer.from(newKey));

          this.profiles = await this.loopProfiles();
        }

        try {
          // this.watchLoraxValue(
          //   LoraxCharacteristicPathMap[Characteristic.OPERATING_STATE]
          // );

          const gitHashRaw = await this.getValue(Characteristic.GIT_HASH);
          this.gitHash = gitHashRaw.toString();

          const deviceUptimeRaw = await this.getValue(Characteristic.UPTIME);
          const deviceUptime = deviceUptimeRaw.readUInt32LE(0);

          const deviceUtcTimeRaw = await this.getValue(Characteristic.UTC_TIME);
          const deviceUtcTime = deviceUtcTimeRaw.readUInt32LE(0);

          const deviceDobRaw = await this.getValue(
            Characteristic.DEVICE_BIRTHDAY
          );
          const deviceDob = deviceDobRaw.readUInt32LE(0);

          const batteryCapacityRaw = await this.getValue(
            Characteristic.BATTERY_CAPACITY
          );
          const batteryCapacity = batteryCapacityRaw.readUInt16LE(0);

          const deviceMacAddressRaw = await this.getValue(Characteristic.EUID);
          this.deviceMacAddress = intArrayToMacAddress(deviceMacAddressRaw);

          if (this.isLorax) {
            const deviceSerialNumberRaw = await this.getValue(
              Characteristic.SERIAL_NUMBER
            );
            this.deviceSerialNumber = deviceSerialNumberRaw.toString();
          }

          const chamberTypeRaw = await this.getValue(
            Characteristic.CHAMBER_TYPE
          );
          const chamberType = chamberTypeRaw.readUInt8(0);

          const diagData: DiagData = {
            session_id: gateway.session_id,
            device_services: await Promise.all(
              (
                await this.server.getPrimaryServices()
              ).map(async (service) => ({
                uuid: service.uuid,
                characteristicCount: (
                  await service.getCharacteristics()
                ).length,
              }))
            ),
            device_profiles: this.profiles,
            device_parameters: {
              name: this.device.name,
              firmware: this.deviceFirmware,
              model: this.deviceModel,
              serialNumber: this.deviceSerialNumber,
              authenticated: true,
              hash: this.gitHash,
              uptime: deviceUptime,
              utc: deviceUtcTime,
              batteryCapacity: batteryCapacity,
              mac: this.deviceMacAddress,
              chamberType,
              dob: deviceDob,
            },
          };

          trackDiags(diagData);

          resolve({
            device: this.device,
            profiles: this.profiles || {},
          });
        } catch (error) {
          console.error(`Failed to track diags: ${error}`);
        }
      } catch (error) {
        console.error(error);
        reject(error);
      }
    });
  }

  async startPolling() {
    this.poller = new EventEmitter();
    if (!this.service) return;

    const initState: Partial<GatewayMemberDeviceState> = {};
    const deviceInfo: Partial<DeviceInformation> = {};

    initState.deviceModel = this.deviceModel;
    deviceInfo.model = this.deviceModel;
    deviceInfo.firmware = this.deviceFirmware;
    deviceInfo.hash = this.gitHash;

    const initTemperature = await this.getValue(Characteristic.HEATER_TEMP);
    console.log(initTemperature, "init temp");
    initState.temperature = Number(initTemperature.readFloatLE(0).toFixed(0));
    console.log(initState);

    const initActiveColor = await this.getValue(
      Characteristic.ACTIVE_LED_COLOR
    );

    console.log(initActiveColor);

    // console.log(convertHexArrayToNumArray());

    // initState.activeColor = {
    //   r: initActiveColor.getUint8(0),
    //   g: initActiveColor.getUint8(1),
    //   b: initActiveColor.getUint8(2),
    // };

    initState.activeColor = {
      r: 0,
      g: 0,
      b: 0,
    };

    initState.brightness = 100;

    // const initBrightness = await this.getValue(Characteristic.LED_BRIGHTNESS);
    // initState.brightness = Number(
    //   (((Number(initBrightness.readUInt8(0)) - 0) / (255 - 0)) * 100).toFixed(0)
    // );

    const initBattery = await this.getValue(Characteristic.BATTERY_SOC);
    initState.battery = Number(initBattery.readFloatLE(0).toFixed(0));

    const initStateState = await this.getValue(Characteristic.OPERATING_STATE);
    initState.state = initStateState.readUInt8(0);

    const initChargeSource = await this.getValue(
      Characteristic.BATTERY_CHARGE_SOURCE
    );
    initState.chargeSource = Number(initChargeSource.readUInt8(0).toFixed(0));

    const initTotalDabs = await this.getValue(Characteristic.TOTAL_HEAT_CYCLES);
    initState.totalDabs = Number(initTotalDabs.readFloatLE(0));
    deviceInfo.totalDabs = initState.totalDabs;

    const initDeviceName = await this.getValue(Characteristic.DEVICE_NAME);
    if (initDeviceName.byteLength == 0 && this.device) {
      // await this.writeRawValue(
      //   Characteristic.DEVICE_NAME,
      //   encoder.encode(this.device.name)
      // );
      initState.deviceName = this.device.name;
    } else {
      initState.deviceName = initDeviceName.toString();
    }
    deviceInfo.name = initState.deviceName;

    const initProfileName = await this.getValue(
      this.isLorax
        ? DynamicLoraxCharacteristics[Characteristic.PROFILE_NAME](
            this.currentProfileId
          )
        : Characteristic.PROFILE_NAME
    );

    const temperatureCall = await this.getValue(
      this.isLorax
        ? DynamicLoraxCharacteristics[Characteristic.PROFILE_PREHEAT_TEMP](
            this.currentProfileId
          )
        : Characteristic.PROFILE_PREHEAT_TEMP
    );
    const timeCall = await this.getValue(
      this.isLorax
        ? DynamicLoraxCharacteristics[Characteristic.PROFILE_PREHEAT_TIME](
            this.currentProfileId
          )
        : Characteristic.PROFILE_PREHEAT_TIME
    );
    const temp = Number(temperatureCall.readFloatLE(0).toFixed(0));
    const time = Number(timeCall.readFloatLE(0).toFixed(0));
    initState.profile = {
      name: initProfileName.toString(),
      temp,
      time: millisToMinutesAndSeconds(time * 1000),
    };

    const initDeviceBirthday = await this.getValue(
      Characteristic.DEVICE_BIRTHDAY
    );
    deviceInfo.dob = initDeviceBirthday.readUInt32LE(0);

    const initDeviceMac = await this.getValue(Characteristic.EUID);
    deviceInfo.mac = intArrayToMacAddress(initDeviceMac);
    initState.deviceMac = deviceInfo.mac;

    const initChamberType = await this.getValue(Characteristic.CHAMBER_TYPE);
    initState.chamberType = initChamberType.readUInt8(0);

    setInterval(async () => {
      const obj: Partial<GatewayMemberDeviceState> = {};
      const initTemperature = await this.getValue(Characteristic.HEATER_TEMP);
      obj.temperature = Number(initTemperature.readFloatLE(0).toFixed(0));

      const initActiveColor = await this.getValue(
        Characteristic.ACTIVE_LED_COLOR
      );

      console.log(initActiveColor);

      // console.log(convertHexArrayToNumArray());

      // initState.activeColor = {
      //   r: initActiveColor.getUint8(0),
      //   g: initActiveColor.getUint8(1),
      //   b: initActiveColor.getUint8(2),
      // };

      obj.activeColor = {
        r: 0,
        g: 0,
        b: 0,
      };

      obj.brightness = 100;

      // const initBrightness = await this.getValue(Characteristic.LED_BRIGHTNESS);
      // initState.brightness = Number(
      //   (((Number(initBrightness.readUInt8(0)) - 0) / (255 - 0)) * 100).toFixed(0)
      // );

      const initBattery = await this.getValue(Characteristic.BATTERY_SOC);
      obj.battery = Number(initBattery.readFloatLE(0).toFixed(0));

      const initStateState = await this.getValue(
        Characteristic.OPERATING_STATE
      );
      obj.state = initStateState.readUInt8(0);

      const initChargeSource = await this.getValue(
        Characteristic.BATTERY_CHARGE_SOURCE
      );
      obj.chargeSource = Number(initChargeSource.readUInt8(0).toFixed(0));

      const initTotalDabs = await this.getValue(
        Characteristic.TOTAL_HEAT_CYCLES
      );
      obj.totalDabs = Number(initTotalDabs.readFloatLE(0));

      const initDeviceName = await this.getValue(Characteristic.DEVICE_NAME);
      obj.deviceName = initDeviceName.toString();

      const initProfileName = await this.getValue(
        this.isLorax
          ? DynamicLoraxCharacteristics[Characteristic.PROFILE_NAME](
              this.currentProfileId
            )
          : Characteristic.PROFILE_NAME
      );

      const temperatureCall = await this.getValue(
        this.isLorax
          ? DynamicLoraxCharacteristics[Characteristic.PROFILE_PREHEAT_TEMP](
              this.currentProfileId
            )
          : Characteristic.PROFILE_PREHEAT_TEMP
      );
      const timeCall = await this.getValue(
        this.isLorax
          ? DynamicLoraxCharacteristics[Characteristic.PROFILE_PREHEAT_TIME](
              this.currentProfileId
            )
          : Characteristic.PROFILE_PREHEAT_TIME
      );
      const temp = Number(temperatureCall.readFloatLE(0).toFixed(0));
      const time = Number(timeCall.readFloatLE(0).toFixed(0));
      obj.profile = {
        name: initProfileName.toString(),
        temp,
        time: millisToMinutesAndSeconds(time * 1000),
      };

      const initChamberType = await this.getValue(Characteristic.CHAMBER_TYPE);
      obj.chamberType = initChamberType.readUInt8(0);
      this.poller.emit("data", obj);
    }, 500);

    // const chargingPoll = await this.pollValue(
    //   Characteristic.BATTERY_CHARGE_SOURCE,
    //   4,
    //   4300
    // );
    // chargingPoll.on("change", (data) => {
    //   this.poller.emit("data", {
    //     chargeSource: Number(data.readUInt8(0).toFixed(0)),
    //   });
    // });

    // const batteryPoll = await this.pollValue(
    //   Characteristic.BATTERY_SOC,
    //   4,
    //   9200
    // );
    // batteryPoll.on("change", (data) => {
    //   this.poller.emit("data", {
    //     battery: Number(data.readFloatLE(0).toFixed(0)),
    //   });
    // });

    // const operatingState = await this.pollValue(
    //   Characteristic.OPERATING_STATE,
    //   0,
    //   115
    // );
    // operatingState.on("change", (data) => {
    //   this.poller.emit("data", { state: data.readUInt8(0) });
    // });

    // const chamberType = await this.pollValue(
    //   Characteristic.CHAMBER_TYPE,
    //   0,
    //   105
    // );
    // chamberType.on("change", (data) => {
    //   this.poller.emit("data", {
    //     chamberType: data.readUInt8(0),
    //   });
    // });

    // const aciveLEDPoll = await this.pollValue(
    //   Characteristic.ACTIVE_LED_COLOR,
    //   4,
    //   1050
    // );
    // let currentLedColor: { r: number; g: number; b: number };
    // aciveLEDPoll.on("data", (data, raw: Buffer) => {
    //   const r = (raw as any).getUint8(0);
    //   const g = (raw as any).getUint8(1);
    //   const b = (raw as any).getUint8(2);
    //   if (JSON.stringify(currentLedColor) != JSON.stringify({ r, g, b }))
    //     this.poller.emit("data", { activeColor: { r, g, b } });
    //   currentLedColor = { r, g, b };
    // });

    // const brightnessPoll = await this.pollValue(
    //   Characteristic.LED_BRIGHTNESS,
    //   1,
    //   9000
    // );
    // brightnessPoll.on("change", (data) => {
    //   this.poller.emit("data", {
    //     brightness: Number(
    //       (((Number(initBrightness) - 0) / (255 - 0)) * 100).toFixed(0)
    //     ),
    //   });
    // });

    // const totalDabsPoll = await this.pollValue(
    //   Characteristic.TOTAL_HEAT_CYCLES,
    //   0,
    //   110
    // );
    // totalDabsPoll.on("data", (data) => {
    //   this.poller.emit("data", {
    //     totalDabs: Number(data.readFloatLE(0)),
    //   });
    // });

    // let lastTemp: number;
    // const tempPoll = await this.pollValue(Characteristic.HEATER_TEMP, 0, 100); // Make this dynamic based on state
    // tempPoll.on("data", async (data) => {
    //   console.log(data, "poll temp");
    //   const conv = Number(data.readFloatLE(0).toFixed(2));
    //   if (lastTemp != conv && conv < 1000 && conv > 1)
    //     this.poller.emit("data", { temperature: conv });
    //   lastTemp = conv;
    // });

    // const currentProfilePoll = await this.pollValue(
    //   Characteristic.PROFILE_CURRENT,
    //   0,
    //   1100
    // );
    // currentProfilePoll.on("data", async (data: Buffer) => {
    //   const profileCurrent = data.readUInt8(0);
    //   console.log(profileCurrent, "profile");
    //   // if (profileCurrent != this.currentProfileId)
    //   //   this.poller.emit("data", {
    //   //     profile: this.profiles[profileCurrent - 1],
    //   //   });
    //   // this.currentProfileId = profileCurrent;
    // });

    // const deviceNamePoll = await this.pollValue(
    //   Characteristic.DEVICE_NAME,
    //   1,
    //   200
    // );
    // deviceNamePoll.on("change", (data, raw) => {
    //   const name = decoder.decode(raw);
    //   this.poller.emit("data", { deviceName: name });
    // });

    this.poller.on("stop", () => {
      // chargingPoll.emit("stop");
      // batteryPoll.emit("stop");
      // operatingState.emit("stop");
      // chamberType.emit("stop");
      // aciveLEDPoll.emit("stop");
      // brightnessPoll.emit("stop");
      // totalDabsPoll.emit("stop");
      // tempPoll.emit("stop");
      // currentProfilePoll.emit("stop");
      // deviceNamePoll.emit("stop");
      this.poller.removeAllListeners();
    });

    return { poller: this.poller, initState, deviceInfo };
  }

  private async writeLoraxCommand(message: Buffer) {
    if (!this.service) return;

    const char = await this.service.getCharacteristic(
      LoraxCharacteristic.COMMAND
    );
    return await char.writeValueWithoutResponse(message);
  }

  private async getLoraxValue(path: string) {
    const command = readCmd(this.loraxLimits, 0, path);
    await this.sendLoraxCommand(LoraxCommands.READ, command, path);
  }

  private async getLoraxValueShort(path: string) {
    const command = readShortCmd(this.loraxLimits, 0, path);
    return await this.sendLoraxCommand(LoraxCommands.READ_SHORT, command, path);
  }

  private async sendLoraxValueShort(path: string, data: Buffer) {
    const command = writeShortCmd(this.loraxLimits, 0, 0, path, data);
    await this.sendLoraxCommand(LoraxCommands.WRITE_SHORT, command, path);
  }

  private async sendLoraxValue(path: string, data: Buffer) {
    const command = writeCmd(this.loraxLimits, 0, 0, path, data);
    await this.sendLoraxCommand(LoraxCommands.WRITE, command, path);
  }

  // private async watchLoraxValue(path: string) {
  //   const command = watchCmd(this.loraxLimits, path);
  //   await this.sendLoraxCommand(LoraxCommands.WATCH, command, path);
  // }

  private async sendLoraxCommand(op: number, data: Uint8Array, path?: string) {
    if (!this.service) return;

    const off = Math.pow(2, 16) - 1;
    this.lastLoraxSequenceId = (this.lastLoraxSequenceId + 1) % off;
    const message = constructLoraxCommand(op, this.lastLoraxSequenceId, data);
    const obj = {
      op,
      seq: this.lastLoraxSequenceId,
      request: message,
      path,
    };
    this.loraxMessages.set(this.lastLoraxSequenceId, obj);

    await this.writeLoraxCommand(message);
    return obj;
  }

  async sendCommand(
    command: { LORAX: Uint8Array; OLD: Uint8Array } | Uint8Array
  ) {
    if (!this.service) return;
    if (this.isLorax)
      await this.sendLoraxValueShort(
        LoraxCharacteristicPathMap[Characteristic.COMMAND],
        Buffer.from(
          "LORAX" in command
            ? this.isLorax
              ? command.LORAX
              : command.OLD
            : command
        )
      );
    else
      await this.writeRawValue(
        Characteristic.COMMAND,
        "OLD" in command
          ? this.isLorax
            ? command.LORAX
            : command.OLD
          : command
      );
  }

  async writeRawValue(characteristic: string, value: Uint8Array) {
    if (!this.service) return;

    const char = await this.service.getCharacteristic(characteristic);
    await char.writeValue(Buffer.from(value));
  }

  async getValue(characteristic: string, bytes = 4): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      if (this.isLorax) {
        const req = await this.getLoraxValueShort(
          LoraxCharacteristicPathMap[characteristic]
            ? LoraxCharacteristicPathMap[characteristic]
            : characteristic
        );

        const func = async (ev: Event) => {
          const {
            value: { buffer },
          }: { value: DataView } = ev.target as any;
          const data = processLoraxReply(buffer);
          const msg = this.loraxMessages.get(data.seq);
          msg.response = { data: data.data, error: !!data.error };

          if (
            msg.op == LoraxCommands.READ_SHORT &&
            msg.seq == req.seq &&
            msg.path == LoraxCharacteristicPathMap[characteristic]
              ? LoraxCharacteristicPathMap[characteristic]
              : characteristic
          ) {
            console.log("Got reply to", msg.op, msg.seq, msg.path);
            this.loraxReply.removeEventListener(
              "characteristicvaluechanged",
              func
            );
            return resolve(msg.response.data);
          }
        };

        this.loraxReply.addEventListener("characteristicvaluechanged", func);
      } else {
        if (characteristic == Characteristic.SERIAL_NUMBER)
          reject({ code: "blocked_characteristic" });

        const service = [
          Characteristic.MODEL_SERVICE,
          Characteristic.FIRMWARE_VERSION,
          Characteristic.HARDWARE_MODEL,
        ].includes(characteristic)
          ? this.modelService
          : this.service;

        const char = await service.getCharacteristic(characteristic);
        const value = await char.readValue();

        // if (bytes == 0) resolve([null, value]);

        let str = "";
        for (let i = 0; i < bytes; i++)
          str += decimalToHexString(value.getUint8(i)).toString();
        const hex = flipHexString("0x" + str, 8);
        // resolve([hex, value]);
      }
    });
  }

  async updateDeviceName(name: string) {
    await this.writeRawValue(
      Characteristic.DEVICE_NAME,
      new TextEncoder().encode(name)
    );
  }

  async updateDeviceDob(date: Date) {
    await this.writeRawValue(
      Characteristic.DEVICE_BIRTHDAY,
      new Uint8Array(pack(date.getTime() / 1000, { bits: 32 }))
    );
  }

  async switchProfile(profile: number) {
    await this.writeRawValue(
      Characteristic.PROFILE,
      new Uint8Array([profile - 1, 0, 0, 0])
    );
    await this.writeRawValue(
      Characteristic.PROFILE_CURRENT,
      DeviceProfile[profile]
    );
  }

  async setBrightness(brightness: number) {
    await this.writeRawValue(
      Characteristic.LANTERN_COLOR,
      LightCommands.LIGHT_DEFAULT
    );
    await this.writeRawValue(
      Characteristic.LANTERN_START,
      LightCommands.LANTERN_ON
    );
    brightness = Number((((brightness - 0) * (255 - 0)) / 100).toFixed(0));
    await this.writeRawValue(
      Characteristic.LED_BRIGHTNESS,
      new Uint8Array(new Array(4).fill(0).map(() => brightness))
    );
    await new Promise((resolve) => setTimeout(() => resolve(true), 1000));
    await this.writeRawValue(
      Characteristic.LANTERN_START,
      LightCommands.LANTERN_OFF
    );
  }

  async setLightMode(mode: PuffLightMode) {
    switch (mode) {
      case PuffLightMode.QueryReady: {
        await this.writeRawValue(
          Characteristic.LANTERN_COLOR,
          LightCommands.LIGHT_QUERY_READY
        );
        await this.writeRawValue(
          Characteristic.LANTERN_START,
          LightCommands.LANTERN_ON
        );
        break;
      }
      case PuffLightMode.MarkedReady: {
        await this.writeRawValue(
          Characteristic.LANTERN_COLOR,
          LightCommands.LIGHT_MARKED_READY
        );
        await this.writeRawValue(
          Characteristic.LANTERN_START,
          LightCommands.LANTERN_ON
        );
        break;
      }
      case PuffLightMode.Default: {
        await this.writeRawValue(
          Characteristic.LANTERN_START,
          LightCommands.LANTERN_OFF
        );
        await this.writeRawValue(
          Characteristic.LANTERN_COLOR,
          LightCommands.LIGHT_NEUTRAL
        );
        break;
      }
    }
  }

  private async loraxProfiles() {
    const profileCurrentRaw = await this.getValue(
      Characteristic.PROFILE_CURRENT
    );
    const profileCurrent = profileCurrentRaw.readUInt8(0);
    this.currentProfileId = profileCurrent;

    let profiles: Record<number, PuffcoProfile> = {};
    for await (const idx of [0, 1, 2, 3]) {
      const profileName = await this.getValue(
        DynamicLoraxCharacteristics[Characteristic.PROFILE_NAME](idx)
      );
      const name = profileName.toString();

      const temperatureCall = await this.getValue(
        DynamicLoraxCharacteristics[Characteristic.PROFILE_PREHEAT_TEMP](idx)
      );

      const timeCall = await this.getValue(
        DynamicLoraxCharacteristics[Characteristic.PROFILE_PREHEAT_TIME](idx)
      );
      const temp = Number(temperatureCall.readFloatLE(0).toFixed(0));
      const time = Number(timeCall.readFloatLE(0).toFixed(0));

      console.log(`Profile #${idx + 1} - ${name} - ${temp} - ${time}`);
      profiles[idx + 1] = {
        name,
        temp,
        time: millisToMinutesAndSeconds(time * 1000),
      };
    }

    return profiles;
  }

  private async loopProfiles() {
    const profileCurrentRaw = await this.getValue(
      Characteristic.PROFILE_CURRENT
    );
    const profileCurrent = profileCurrentRaw.readUInt8(0);
    this.currentProfileId = profileCurrent;

    let profiles: Record<number, PuffcoProfile> = {};
    const startingIndex = profileCurrent;
    for await (const idx of [0, 1, 2, 3]) {
      const key = (idx + startingIndex) % DeviceProfileReverse.length;
      // await this.sendProfile(
      //   Characteristic.PROFILE,
      //   new Uint8Array([key, 0, 0, 0])
      // );
      const profileName = await this.getValue(Characteristic.PROFILE_NAME);
      const name = profileName.toString();

      const temperatureCall = await this.getValue(
        Characteristic.PROFILE_PREHEAT_TEMP
      );
      const timeCall = await this.getValue(Characteristic.PROFILE_PREHEAT_TIME);
      const temp = Number(temperatureCall.readFloatLE(0).toFixed(0));
      const time = Number(timeCall.readFloatLE(0).toFixed(0));

      console.log(`Profile #${key + 1} - ${name} - ${temp} - ${time}`);
      profiles[key + 1] = {
        name,
        temp,
        time: millisToMinutesAndSeconds(time * 1000),
      };
    }

    return profiles;
  }

  private async pollValue(
    characteristic: string,
    bytes = 4,
    time?: number
  ): Promise<EventEmitter> {
    if (!time) time = 10000; // 10s
    // time = time + Math.floor(Math.random() * 2000) + 100 // Make this jitter higher on android only
    const listener = new EventEmitter();
    const char = await this.service
      .getCharacteristic(characteristic)
      .then((char) => char)
      .catch(() => null);

    const func = this.isLorax
      ? async () => {
          const value = await this.getValue(characteristic);
          listener.emit("change", value);
          listener.emit("data", value);
        }
      : async () => {
          const value = await char?.readValue();
          if (bytes == 0) {
            listener.emit("data", null, value);
            listener.emit("change", null, value);
          } else {
            let str = "";
            for (let i = 0; i < bytes; i++)
              str += decimalToHexString(value.getUint8(i)).toString();
            const hex = flipHexString("0x" + str, 8);
            listener.emit("data", hex, value);
            if (hex != lastValue) listener.emit("change", hex, value);
            lastValue = hex;
          }
        };

    let lastValue: string;
    func();
    const int = setInterval(() => func(), time);

    listener.on("stop", () => {
      listener.removeAllListeners();
      clearInterval(int);
    });

    return listener;
  }

  disconnect() {
    if (!this.server || !this.poller) return;
    this.poller.emit("stop");
    this.server.disconnect();
  }
}
