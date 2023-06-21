import { createHash } from "crypto";
import { EventEmitter } from "events";
import { unpack, pack } from "byte-data";
import { GatewayMemberDeviceState, GroupState } from "../../types/gateway";
import {
  convertFromHex,
  convertHexStringToNumArray,
  millisToMinutesAndSeconds,
  constructLoraxCommand,
  processLoraxReply,
  intArrayToMacAddress,
  readShortCmd,
  writeShortCmd,
  numbersToLetters,
  openCmd,
  watchCmd,
  processLoraxEvent,
  unwatchCmd,
  closeCmd,
} from "../functions";
import { DeviceInformation, DiagData } from "../../types/api";
import { trackDiags } from "../hash";
import { LoraxLimits, LoraxMessage, PuffcoProfile } from "../../types/puffco";
import { gateway } from "../gateway";
import {
  Characteristic,
  LoraxCommands,
  LoraxCharacteristic,
  DynamicLoraxCharacteristics,
  LoraxCharacteristicPathMap,
  DeviceProfile,
  LightCommands,
  PuffLightMode,
  DeviceProfileReverse,
  LORAX_SERVICE,
  HANDSHAKE_KEY,
  LORAX_HANDSHAKE_KEY,
  PUP_SERVICE,
  PUP_APP_VERSION,
  SERVICE,
  SILLABS_OTA_SERVICE,
  SILLABS_VERISON,
  DeviceCommand,
  intMap,
} from "./constants";
import { store } from "../../state/store";
import { GroupState as GroupStateInterface } from "../../state/slices/group";
import { PuffcoOperatingState } from "@puff-social/commons/dist/puffco";
import { Op } from "@puff-social/commons/dist/constants";

const decoder = new TextDecoder("utf-8");

export interface Device {
  device: BluetoothDevice;

  server: BluetoothRemoteGATTServer;
  service: BluetoothRemoteGATTService;
  modelService?: BluetoothRemoteGATTService;
  silabsService?: BluetoothRemoteGATTService;
  pupService?: BluetoothRemoteGATTService;

  loraxReply?: BluetoothRemoteGATTCharacteristic;
  loraxEvent?: BluetoothRemoteGATTCharacteristic;

  poller: EventEmitter;
  profiles: Record<number, PuffcoProfile>;

  pollerMap: Map<string, EventEmitter>;
  watchMap: Map<number, string>;
  pathWatchers: Map<string, number>;

  watcherSuspendTimeout: NodeJS.Timeout;

  lastLoraxSequenceId: number;
  loraxMessages: Map<number, LoraxMessage>;
  loraxLimits: LoraxLimits;

  isPup: boolean;
  isLorax: boolean;

  sendingCommand: boolean;

  operatingState: number;
  lastOperatingStateUpdate: Date;

  gitHash: string;
  deviceName: string;
  chamberType: number;
  deviceModel: string;
  hardwareVersion: number;
  deviceFirmware: string;
  deviceSerialNumber: string;
  deviceMacAddress: string;
  currentProfileId: number;

  on(event: "gattdisconnect", listener: () => void): this;
}

export class Device extends EventEmitter {
  constructor() {
    super();
    this.lastLoraxSequenceId = 0;
    this.loraxLimits = { maxCommands: 0, maxFiles: 0, maxPayload: 0 };
    this.loraxMessages = new Map();
    this.pollerMap = new Map();
    this.watchMap = new Map();
    this.pathWatchers = new Map();
    this.sendingCommand = false;
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
              {
                services: [SILLABS_OTA_SERVICE],
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
          this.disconnect();
          reject(error);
        }

        this.server = await this.device.gatt.connect();

        const primaryServices = await this.server.getPrimaryServices();
        this.isLorax = !!primaryServices.find(
          (service) => service.uuid == LORAX_SERVICE
        );
        this.isPup = !!primaryServices.find(
          (service) => service.uuid == PUP_SERVICE
        );

        this.service = await this.server.getPrimaryService(
          this.isLorax ? LORAX_SERVICE : SERVICE
        );

        this.device.addEventListener("gattserverdisconnected", () => {
          console.log("Gatt server disconnected");
          this.emit("gattdisconnect");

          this.disconnect();
        });

        if (!this.isLorax)
          this.modelService = await this.server.getPrimaryService(
            Characteristic.MODEL_SERVICE
          );

        if (this.isLorax && !this.isPup)
          this.silabsService = await this.server.getPrimaryService(
            SILLABS_OTA_SERVICE
          );

        if (this.isLorax && this.isPup)
          this.pupService = await this.server.getPrimaryService(PUP_SERVICE);

        // DEBUG ONLY
        if (typeof window != "undefined") {
          window["unpack"] = unpack;
          window["pack"] = pack;
        }

        if (!this.isLorax) {
          const modelRaw = await this.getValue(Characteristic.HARDWARE_MODEL);
          this.deviceModel = modelRaw.toString();

          const firmwareRaw = await this.getValue(
            Characteristic.FIRMWARE_VERSION
          );
          this.deviceFirmware = decoder.decode(firmwareRaw);

          const hardwareVersion = await this.getValue(
            Characteristic.HARDWARE_VERSION
          );
          this.hardwareVersion = hardwareVersion.readUInt8(0);

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
          // This triggers pairing on lorax ;P
          if (this.isPup) {
            const pupVer = await this.pupService.getCharacteristic(
              PUP_APP_VERSION
            );
            await pupVer.readValue();
          } else {
            const silLabsVer = await this.silabsService.getCharacteristic(
              SILLABS_VERISON
            );
            await silLabsVer.readValue();
          }

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
                if (!msg) return upperResolve(true);
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

                  case LoraxCommands.WRITE_SHORT: {
                    if (msg.response.error)
                      console.log(
                        "Got an error response to a write short",
                        msg.path,
                        msg,
                        data
                      );

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
                }
              }
            );
            this.loraxReply.startNotifications();

            this.sendLoraxCommand(LoraxCommands.GET_LIMITS, null);
          });

          const modelRaw = await this.getValue(Characteristic.HARDWARE_MODEL);
          this.deviceModel = modelRaw.readUInt32LE(0).toString();

          const hardwareVersion = await this.getValue(
            Characteristic.HARDWARE_VERSION
          );
          this.hardwareVersion = hardwareVersion.readUInt8(0);

          const firmwareRaw = await this.getValue(
            Characteristic.FIRMWARE_VERSION
          );
          this.deviceFirmware = numbersToLetters(firmwareRaw.readUInt8(0) + 5);

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

          const deviceMacAddressRaw = await this.getValue(
            Characteristic.BT_MAC
          );
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
          this.chamberType = chamberType;

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
              hardwareVersion: this.hardwareVersion,
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
        if (this.server) this.server.disconnect();
        this.disconnect();
        console.error(error);
        reject(error);
      }
    });
  }

  async watchPath(path: string, int: number, len?: number) {
    const open = await this.openPath(path);
    if (open.byteLength == 0) return;

    const length = [
      "/p/app/hcs",
      "/p/bat/chg/stat",
      "/p/bat/chg/src",
      "/p/htr/chmt",
      "/p/app/mc",
      "/u/app/ui/stlm",
      "/p/app/bt/delb",
      "/p/app/ltrn/cmd",
      "/p/app/facr",
      "/p/app/bt/tba",
    ].includes(path)
      ? 1
      : 4;

    const watch = watchCmd(open.readUInt8(0), int, len ? len : length);
    const cmd = await this.sendLoraxCommand(LoraxCommands.WATCH, watch, path);
    this.watchMap.set(open.readUInt8(0), path);
    this.pathWatchers.set(path, open.readUInt8());
    return cmd;
  }

  async closePath(path: string) {
    const watch = this.pathWatchers.get(path);

    const unwatch = closeCmd(watch);
    await this.sendLoraxCommand(LoraxCommands.CLOSE, unwatch, path);

    this.watchMap.delete(watch);
    this.pathWatchers.delete(path);
    return watch;
  }

  async unwatchPath(path: string) {
    const close = await this.closePath(path);

    const unwatch = unwatchCmd(close);
    const cmd = await this.sendLoraxCommand(LoraxCommands.WATCH, unwatch, path);

    return cmd;
  }

  async startPolling() {
    this.poller = new EventEmitter();
    if (!this.service) return;

    const initState: Partial<GatewayMemberDeviceState> = {};
    const deviceInfo: Partial<DeviceInformation> = {};

    initState.deviceModel = this.deviceModel;
    deviceInfo.model = this.deviceModel;
    deviceInfo.firmware = this.deviceFirmware;
    deviceInfo.hardware = this.hardwareVersion;
    deviceInfo.gitHash = this.gitHash;

    const initTemperature = await this.getValue(Characteristic.HEATER_TEMP);
    initState.temperature = Number(initTemperature.readFloatLE(0).toFixed(0));

    const initActiveColor = await this.getValue(
      Characteristic.ACTIVE_LED_COLOR
    );

    initState.activeColor = {
      r: initActiveColor.readUInt8(0),
      g: initActiveColor.readUInt8(1),
      b: initActiveColor.readUInt8(2),
    };

    const initBrightness = await this.getValue(Characteristic.LED_BRIGHTNESS);
    initState.brightness = Number(
      (((Number(initBrightness.readUInt8(0)) - 0) / (255 - 0)) * 100).toFixed(0)
    );

    const initBattery = await this.getValue(Characteristic.BATTERY_SOC);
    initState.battery = Number(initBattery.readFloatLE(0).toFixed(0));

    const initStateState = await this.getValue(Characteristic.OPERATING_STATE);
    initState.state = this.isLorax
      ? initStateState.readUInt8(0)
      : initStateState.readFloatLE(0);

    const initStateTime = await this.getValue(
      Characteristic.STATE_ELAPSED_TIME
    );
    initState.stateTime = Number(initStateTime.readFloatLE(0));

    const initChargeSource = await this.getValue(
      Characteristic.BATTERY_CHARGE_SOURCE
    );
    initState.chargeSource = Number(
      (this.isLorax
        ? initChargeSource.readUInt8(0)
        : initChargeSource.readFloatLE(0)
      ).toFixed(0)
    );

    const initTotalDabs = await this.getValue(Characteristic.TOTAL_HEAT_CYCLES);
    initState.totalDabs = Number(initTotalDabs.readFloatLE(0));
    deviceInfo.totalDabs = initState.totalDabs;

    const initDabsPerDay = await this.getValue(Characteristic.DABS_PER_DAY);

    deviceInfo.dabsPerDay = Number(initDabsPerDay.readFloatLE(0).toFixed(2));
    if (isNaN(deviceInfo.dabsPerDay)) deviceInfo.dabsPerDay = 0.0;
    initState.dabsPerDay = deviceInfo.dabsPerDay;

    const initDeviceName = await this.getValue(Characteristic.DEVICE_NAME);
    if (initDeviceName.byteLength == 0 && this.device) {
      initState.deviceName = this.device.name;
    } else {
      initState.deviceName = initDeviceName.toString();
    }
    deviceInfo.name = initState.deviceName;
    this.deviceName = initState.deviceName;

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
    const colorCall = await this.getValue(
      DynamicLoraxCharacteristics[Characteristic.PROFILE_COLOR](
        this.currentProfileId
      )
    );
    const temp = Number(temperatureCall.readFloatLE(0).toFixed(0));
    const time = Number(timeCall.readFloatLE(0).toFixed(0));

    const color =
      "#" +
      colorCall.readUInt8(0).toString(16) +
      colorCall.readUInt8(1).toString(16) +
      colorCall.readUInt8(2).toString(16);

    initState.profile = {
      name: initProfileName.toString(),
      temp,
      color,
      time: millisToMinutesAndSeconds(time * 1000),
      intensity: this.isLorax
        ? (
            await this.getValue(
              DynamicLoraxCharacteristics.PROFILE_INTENSITY(
                this.currentProfileId
              )
            )
          ).readFloatLE(0)
        : 0,
    };

    const initDeviceBirthday = await this.getValue(
      Characteristic.DEVICE_BIRTHDAY
    );
    deviceInfo.dob = initDeviceBirthday.readUInt32LE(0);

    const initDeviceMac = await this.getValue(Characteristic.BT_MAC);
    deviceInfo.mac = intArrayToMacAddress(initDeviceMac);
    initState.deviceMac = deviceInfo.mac;

    const initChamberType = await this.getValue(Characteristic.CHAMBER_TYPE);
    initState.chamberType = initChamberType.readUInt8(0);
    this.chamberType = initState.chamberType;

    if (this.isLorax) {
      this.loraxEvent = await this.service.getCharacteristic(
        LoraxCharacteristic.EVENT
      );

      let currentOperatingState: number;
      let currentChamberType: number;
      let lastTemp: number;
      let lastElapsedTime: number;

      this.loraxEvent.addEventListener(
        "characteristicvaluechanged",
        async (ev) => {
          const {
            value: { buffer },
          }: { value: DataView } = ev.target as any;
          const buf = Buffer.from(buffer);
          const reply = processLoraxEvent(buf);
          const path = this.watchMap.get(reply.watchId);

          if (!reply.data || reply.data.byteLength == 0)
            return console.log("Ignoring", reply, path);

          switch (path) {
            case LoraxCharacteristicPathMap[Characteristic.OPERATING_STATE]: {
              if (reply.data.byteLength != 1) return;
              const val = reply.data.readUInt8(0);
              if (val != currentOperatingState) {
                this.poller.emit("data", { state: val });

                const {
                  group: { group },
                }: { group: GroupStateInterface } = store.getState();

                if (group) {
                  const groupStartOnBatteryCheck =
                    localStorage.getItem("puff-battery-check-start") ==
                      "true" || false;

                  if (
                    group.state == GroupState.Awaiting &&
                    val == PuffcoOperatingState.TEMP_SELECT
                  ) {
                    this.setLightMode(PuffLightMode.MarkedReady);
                  }

                  if (
                    group.state == GroupState.Chilling &&
                    val == PuffcoOperatingState.INIT_BATTERY_DISPLAY &&
                    groupStartOnBatteryCheck
                  ) {
                    setTimeout(() => gateway.send(Op.InquireHeating));
                  }

                  if (
                    group.state == GroupState.Awaiting &&
                    val == PuffcoOperatingState.INIT_BATTERY_DISPLAY &&
                    groupStartOnBatteryCheck
                  ) {
                    setTimeout(() => gateway.send(Op.StartWithReady));
                  }
                }

                if (
                  val == PuffcoOperatingState.HEAT_CYCLE_PREHEAT &&
                  currentOperatingState !=
                    PuffcoOperatingState.HEAT_CYCLE_PREHEAT
                ) {
                  console.log(
                    `DEBUG: Preheat started, suspending poller and starting watcher`
                  );
                  if (this.watcherSuspendTimeout) {
                    console.log(
                      "DEBUG: ^ Ignored because was less than 15 seconds since last heat/preheat"
                    );
                    clearTimeout(this.watcherSuspendTimeout);
                  } else {
                    this.pollerMap.get("chamberTemp").emit("suspend");
                    await this.watchWithConfirmation(
                      LoraxCharacteristicPathMap[
                        Characteristic.STATE_ELAPSED_TIME
                      ]
                    );
                    await this.watchWithConfirmation(
                      LoraxCharacteristicPathMap[Characteristic.CHAMBER_TYPE]
                    );
                    await this.watchWithConfirmation(
                      LoraxCharacteristicPathMap[Characteristic.HEATER_TEMP]
                    );
                  }
                } else if (
                  val == PuffcoOperatingState.IDLE &&
                  [
                    PuffcoOperatingState.HEAT_CYCLE_PREHEAT,
                    PuffcoOperatingState.HEAT_CYCLE_ACTIVE,
                  ].includes(currentOperatingState)
                ) {
                  console.log(
                    `DEBUG: Back to Idle, unsuspending poller and stopping watcher`
                  );
                  this.watcherSuspendTimeout = setTimeout(async () => {
                    console.log("Waited 15s, unwatching and resuming");
                    await this.unwatchPath(
                      LoraxCharacteristicPathMap[Characteristic.CHAMBER_TYPE]
                    );
                    await this.unwatchPath(
                      LoraxCharacteristicPathMap[Characteristic.HEATER_TEMP]
                    );
                    await this.unwatchPath(
                      LoraxCharacteristicPathMap[
                        Characteristic.STATE_ELAPSED_TIME
                      ]
                    );
                    this.pollerMap.get("chamberTemp").emit("resume");
                  }, 15 * 1000);
                }

                currentOperatingState = val;
                this.lastOperatingStateUpdate = new Date();
              }
              break;
            }
            case LoraxCharacteristicPathMap[Characteristic.CHAMBER_TYPE]: {
              if (reply.data.byteLength != 1) return;
              const val = reply.data.readUInt8(0);
              if (val != currentChamberType && reply.data.byteLength == 1) {
                this.poller.emit("data", {
                  chamberType: val,
                });
                this.chamberType = val;
                currentChamberType = val;
              }
              break;
            }
            case LoraxCharacteristicPathMap[
              Characteristic.STATE_ELAPSED_TIME
            ]: {
              const conv = Number(reply.data.readFloatLE(0));
              if (lastElapsedTime != conv && reply.data.byteLength == 4) {
                this.poller.emit("data", {
                  stateTime: conv,
                });
                lastElapsedTime = conv;
              }
              break;
            }
            case LoraxCharacteristicPathMap[Characteristic.HEATER_TEMP]: {
              if (reply.data.byteLength < 4) return;
              const conv = Number(reply.data.readFloatLE(0).toFixed(0));
              if (lastTemp != conv && conv < 1000 && conv > 1) {
                this.poller.emit("data", { temperature: conv });
                lastTemp = conv;
              }
              break;
            }

            default:
              break;
          }
        }
      );

      this.loraxEvent.startNotifications();

      for await (const path of [
        LoraxCharacteristicPathMap[Characteristic.OPERATING_STATE],
      ]) {
        try {
          await this.watchWithConfirmation(path);

          const int = setInterval(async () => {
            if (
              new Date().getTime() - this.lastOperatingStateUpdate.getTime() >
              intMap[Characteristic.OPERATING_STATE] * 2
            ) {
              console.log(
                "DEBUG: Deviation for",
                Characteristic.OPERATING_STATE,
                "is beyond 2x, unwatching and rewatching",
                `(D: ${
                  new Date().getTime() - this.lastOperatingStateUpdate.getTime()
                })`
              );

              await this.unwatchPath(Characteristic.OPERATING_STATE);
              setTimeout(() => {
                this.watchPath(
                  Characteristic.OPERATING_STATE,
                  intMap[Characteristic.OPERATING_STATE]
                );
              }, 500);
            }
          }, intMap[Characteristic.OPERATING_STATE]);

          this.once("gattdisconnect", () => {
            if (int) clearInterval(int);
          });
        } catch (error) {
          continue;
        }
        await new Promise((resolve) => setTimeout(() => resolve(true), 200));
      }
    } else {
      let currentOperatingState: number;
      const operatingState = await this.pollValue(
        Characteristic.OPERATING_STATE,
        this.isLorax ? 555 : 1200
      );
      operatingState.on("change", (data: Buffer) => {
        if (!data || data.byteLength != (this.isLorax ? 1 : 4)) return;
        const val = this.isLorax ? data.readUInt8(0) : data.readFloatLE(0);
        if (val != currentOperatingState) {
          this.poller.emit("data", { state: val });

          const {
            group: { group },
          }: { group: GroupStateInterface } = store.getState();

          if (group) {
            const groupStartOnBatteryCheck =
              localStorage.getItem("puff-battery-check-start") == "true" ||
              false;

            if (
              group.state == GroupState.Awaiting &&
              val == PuffcoOperatingState.TEMP_SELECT
            ) {
              this.setLightMode(PuffLightMode.MarkedReady);
            }

            if (
              group.state == GroupState.Chilling &&
              val == PuffcoOperatingState.INIT_BATTERY_DISPLAY &&
              groupStartOnBatteryCheck
            ) {
              setTimeout(() => gateway.send(Op.InquireHeating));
            }

            if (
              group.state == GroupState.Awaiting &&
              val == PuffcoOperatingState.INIT_BATTERY_DISPLAY &&
              groupStartOnBatteryCheck
            ) {
              setTimeout(() => gateway.send(Op.StartWithReady));
            }
          }
        }
        currentOperatingState = val;
      });

      this.poller.on("stop", () => {
        const pollers = [operatingState];

        for (const poller of pollers) poller.emit("stop");
      });
    }

    let currentBrightness: number;
    let currentLedColor: { r: number; g: number; b: number };
    const LEDPoller = await this.pollValue(
      [Characteristic.ACTIVE_LED_COLOR, Characteristic.LED_BRIGHTNESS],
      1500
    );
    LEDPoller.on("data", (data: Buffer, characteristic: string) => {
      if (characteristic == Characteristic.ACTIVE_LED_COLOR) {
        if (!data || data.byteLength != 8) return;
        const r = data.readUInt8(0);
        const g = data.readUInt8(1);
        const b = data.readUInt8(2);
        if (JSON.stringify(currentLedColor) != JSON.stringify({ r, g, b }))
          this.poller.emit("data", { activeColor: { r, g, b } });
        currentLedColor = { r, g, b };
      } else if (characteristic == Characteristic.LED_BRIGHTNESS) {
        if (!data || data.byteLength != 4) return;
        const mainLed = data.readUInt8(2);
        const val = Number(mainLed.toFixed(0));
        if (val != currentBrightness)
          this.poller.emit("data", {
            brightness: val,
          });
        currentBrightness = val;
      }
    });
    this.pollerMap.set("led", LEDPoller);

    await new Promise((resolve) => setTimeout(() => resolve(1), 50));

    let currentTemperature: number;
    const ChamberTempPoll = await this.pollValue(
      [Characteristic.HEATER_TEMP, Characteristic.CHAMBER_TYPE],
      5000
    );
    ChamberTempPoll.on("data", (data: Buffer, characteristic: string) => {
      if (characteristic == Characteristic.HEATER_TEMP) {
        if (!data || data.byteLength != 4) return;
        const conv = Number(data.readFloatLE(0).toFixed(0));
        if (currentTemperature != conv && conv < 1000 && conv > 1)
          this.poller.emit("data", { temperature: conv });
        currentTemperature = conv;
      } else if (characteristic == Characteristic.CHAMBER_TYPE) {
        if (!data || data.byteLength != 1) return;
        const chamberType = data.readUInt8(0);
        if (chamberType != this.chamberType)
          this.poller.emit("data", {
            chamberType: chamberType,
          });
        this.chamberType = chamberType;
      }
    });
    this.pollerMap.set("chamberTemp", ChamberTempPoll);

    await new Promise((resolve) => setTimeout(() => resolve(1), 50));

    let currentBattery: number;
    let currentChargingState: number;
    const BatteryProfilePoll = await this.pollValue(
      [
        Characteristic.PROFILE_CURRENT,
        Characteristic.BATTERY_CHARGE_SOURCE,
        Characteristic.BATTERY_SOC,
      ],
      8000
    );
    BatteryProfilePoll.on("data", (data: Buffer, characteristic: string) => {
      if (characteristic == Characteristic.PROFILE_CURRENT) {
        if (data.byteLength != 1) return;
        const profileCurrent = data.readUInt8(0);
        if (
          profileCurrent != this.currentProfileId &&
          this.profiles[profileCurrent + 1] &&
          data.byteLength == 1
        ) {
          this.poller.emit("data", {
            profile: this.profiles[profileCurrent + 1],
          });
          this.currentProfileId = profileCurrent;
        }
      } else if (characteristic == Characteristic.BATTERY_CHARGE_SOURCE) {
        if (data.byteLength != 1) return;
        const val = data.readUInt8(0);
        if (val != currentChargingState) {
          this.poller.emit("data", {
            chargeSource: val,
          });
          currentChargingState = val;
        }
      } else if (characteristic == Characteristic.BATTERY_SOC) {
        if (data.byteLength < 4) return;
        const val = Number(data.readFloatLE(0).toFixed(0));
        if (val != currentBattery) {
          this.poller.emit("data", {
            battery: val,
          });
          currentBattery = val;
        }
      }
    });
    this.pollerMap.set("batteryProfile", BatteryProfilePoll);

    await new Promise((resolve) => setTimeout(() => resolve(1), 50));

    let currentDabCount: number;
    const DabCountPoll = await this.pollValue(
      [Characteristic.TOTAL_HEAT_CYCLES],
      10000
    );
    DabCountPoll.on("data", (data: Buffer, characteristic: string) => {
      if (characteristic == Characteristic.TOTAL_HEAT_CYCLES) {
        if (data.byteLength != 4) return;
        const val = data.readFloatLE(0);
        if (val != currentDabCount) {
          this.poller.emit("data", {
            totalDabs: val,
          });
          currentDabCount = val;
        }
      }
    });
    this.pollerMap.set("totalDabs", DabCountPoll);

    this.poller.on("stop", (disconnect = true) => {
      this.poller.removeAllListeners();
      if (this.server.connected && disconnect) this.server.disconnect();

      const pollers = ["led", "chamberTemp", "batteryProfile", "totalDabs"];

      for (const name of pollers) {
        const poller = this.pollerMap.get(name);
        if (poller) {
          this.pollerMap.delete(name);
          poller.emit("stop");
        }
      }
    });

    const {
      group: { group },
    }: { group: GroupStateInterface } = store.getState();

    await new Promise((resolve) => setTimeout(() => resolve(true), 300));

    if (group) {
      if (group.state == GroupState.Awaiting) {
        await this.setLightMode(PuffLightMode.QueryReady);
        await this.sendCommand(DeviceCommand.BONDING);
      } else {
        await this.setLightMode(PuffLightMode.Default);
      }
    }

    return { poller: this.poller, initState, deviceInfo };
  }

  private async writeLoraxCommand(message: Buffer) {
    if (!this.service) return;

    const char = await this.service.getCharacteristic(
      LoraxCharacteristic.COMMAND
    );
    try {
      return await char.writeValueWithoutResponse(message);
    } catch (error) {
      if (
        error &&
        error.toString().endsWith("GATT operation already in progress.")
      ) {
        const seq = message.readUInt16LE(0);
        const op = message.readUInt8(2);

        const data = this.loraxMessages.get(seq);

        console.log(
          `DEBUG: Already in progress when writing op: ${op} - seq: ${seq}`,
          data
        );

        if (op == LoraxCommands.WRITE_SHORT)
          return this.writeLoraxCommand(message);
      } else {
        console.log(
          "There was an error with writeValueWithoutResponse",
          message,
          error
        );
      }
      return;
    }
  }

  private async getLoraxValueShort(path: string) {
    const command = readShortCmd(this.loraxLimits, path);
    return await this.sendLoraxCommand(LoraxCommands.READ_SHORT, command, path);
  }

  async sendLoraxValueShort(path: string, data: Buffer, padding = true) {
    const command = writeShortCmd(path, data, padding);
    await this.sendLoraxCommand(LoraxCommands.WRITE_SHORT, command, path);
  }

  private async sendLoraxCommand(op: number, data: Uint8Array, path?: string) {
    if (!this.service) return;
    if (this.sendingCommand && op == LoraxCommands.WRITE_SHORT)
      return this.sendLoraxCommand(op, data, path);
    else if (this.sendingCommand) return;

    this.sendingCommand = true;

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
    this.sendingCommand = false;
    return obj;
  }

  private async watchWithConfirmation(path: string) {
    return new Promise(async (resolve, reject) => {
      try {
        const req = await this.watchPath(path, intMap[path]);

        const func = async (ev: Event) => {
          const {
            value: { buffer },
          }: { value: DataView } = ev.target as any;
          const data = processLoraxReply(buffer);
          const msg = this.loraxMessages.get(data.seq);
          msg.response = { data: data.data, error: !!data.error };

          if (
            msg.op == LoraxCommands.WATCH &&
            msg.seq == req.seq &&
            msg.path == path
          ) {
            if (msg.response.error)
              console.log(
                "Got error'd reply to",
                msg.op,
                msg.seq,
                msg.path,
                msg.response.data,
                data.error
              );
            this.loraxReply.removeEventListener(
              "characteristicvaluechanged",
              func
            );
            return resolve(msg.response.data);
          }
        };

        this.loraxReply.addEventListener("characteristicvaluechanged", func);
      } catch (error) {
        return reject(error);
      }
    });
  }

  async sendCommand(
    command: { LORAX: Uint8Array; OLD: Uint8Array } | Uint8Array,
    characteristic?: string
  ) {
    let attempts = 0;
    const func = async (attempt) => {
      if (attempt > 5) return;
      if (!this.service) return;
      if (this.isLorax)
        await this.sendLoraxValueShort(
          LoraxCharacteristicPathMap[characteristic || Characteristic.COMMAND],
          Buffer.from("LORAX" in command ? command.LORAX : command)
        ).catch(() => {
          console.log("already in progress");
          attempts++;
          return func(attempts).catch(() => {});
        });
      else
        await this.writeRawValue(
          characteristic || Characteristic.COMMAND,
          "OLD" in command ? command.OLD : command
        );
    };

    return func(attempts);
  }

  async writeRawValue(characteristic: string, value: Uint8Array) {
    if (!this.service) return;

    const char = await this.service.getCharacteristic(characteristic);
    try {
      await char.writeValue(Buffer.from(value));
    } catch (error) {
      console.log("There was an error with writeValue", error);
    }
  }

  async getValue(
    characteristic: string,
    bytes = 4
  ): Promise<Buffer | undefined> {
    return new Promise(async (resolve, reject) => {
      if (this.isLorax) {
        try {
          const req = await this.getLoraxValueShort(
            LoraxCharacteristicPathMap[characteristic]
              ? LoraxCharacteristicPathMap[characteristic]
              : characteristic
          );

          if (!req) return resolve(Buffer.alloc(0));

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
              msg.path ==
                (LoraxCharacteristicPathMap[characteristic]
                  ? LoraxCharacteristicPathMap[characteristic]
                  : characteristic)
            ) {
              if (msg.response.error)
                console.log(
                  "Got error'd reply to",
                  msg.op,
                  msg.seq,
                  msg.path,
                  msg.response.data,
                  data.error
                );
              this.loraxReply.removeEventListener(
                "characteristicvaluechanged",
                func
              );
              return resolve(msg.response.data);
            }
          };

          this.loraxReply.addEventListener("characteristicvaluechanged", func);
        } catch (error) {
          console.log(
            `Failed to get value for ${characteristic} - ${LoraxCharacteristicPathMap[characteristic]}`
          );
          return undefined;
        }
      } else {
        if (characteristic == Characteristic.SERIAL_NUMBER)
          reject({ code: "blocked_characteristic" });

        const service = [
          Characteristic.MODEL_SERVICE,
          Characteristic.FIRMWARE_VERSION,
          Characteristic.HARDWARE_VERSION,
          Characteristic.HARDWARE_MODEL,
        ].includes(characteristic)
          ? this.modelService
          : this.service;

        const char = await service.getCharacteristic(characteristic);
        try {
          const value = await char.readValue();

          return resolve(Buffer.from(value.buffer));
        } catch (error) {
          return resolve(null);
        }
      }
    });
  }

  async openPath(path: string): Promise<Buffer | undefined> {
    return new Promise(async (resolve, reject) => {
      if (this.isLorax) {
        try {
          const command = openCmd(this.loraxLimits, path);
          const req = await this.sendLoraxCommand(
            LoraxCommands.OPEN,
            command,
            path
          );

          const func = async (ev: Event) => {
            const {
              value: { buffer },
            }: { value: DataView } = ev.target as any;
            const data = processLoraxReply(buffer);
            const msg = this.loraxMessages.get(data.seq);
            msg.response = { data: data.data, error: !!data.error };

            if (
              msg.op == LoraxCommands.OPEN &&
              msg.seq == req.seq &&
              msg.path == path
            ) {
              if (msg.response.error)
                console.log(
                  "Got error'd reply to",
                  msg.op,
                  msg.seq,
                  msg.path,
                  msg.response.data,
                  data.error
                );
              this.loraxReply.removeEventListener(
                "characteristicvaluechanged",
                func
              );
              return resolve(msg.response.data);
            }
          };

          this.loraxReply.addEventListener("characteristicvaluechanged", func);
        } catch (error) {
          return undefined;
        }
      }
    });
  }

  async boostTemp(temp: number) {
    if (this.isLorax) {
      const buf = Buffer.alloc(4);
      buf.writeFloatLE(temp);
      await this.sendLoraxValueShort(
        LoraxCharacteristicPathMap[Characteristic.TEMPERATURE_OVERRIDE],
        buf
      );
    } else {
      console.log("Not yet implemented");
      // await this.writeRawValue(
      //   Characteristic.DEVICE_NAME,
      //   new TextEncoder().encode(name)
      // );
    }
  }

  async boostTime(time: number) {
    if (this.isLorax) {
      const buf = Buffer.alloc(4);
      buf.writeFloatLE(time);
      await this.sendLoraxValueShort(
        LoraxCharacteristicPathMap[Characteristic.TIME_OVERRIDE],
        buf
      );
    } else {
      console.log("Not yet implemented");
      // await this.writeRawValue(
      //   Characteristic.DEVICE_NAME,
      //   new TextEncoder().encode(name)
      // );
    }
  }

  async updateDeviceName(name: string) {
    if (this.isLorax) {
      await this.sendLoraxValueShort(
        LoraxCharacteristicPathMap[Characteristic.DEVICE_NAME],
        Buffer.from(new TextEncoder().encode(name))
      );
    } else {
      await this.writeRawValue(
        Characteristic.DEVICE_NAME,
        new TextEncoder().encode(name)
      );
    }
  }

  async updateDeviceDob(date: Date) {
    if (this.isLorax) {
      const buff = Buffer.allocUnsafe(4);
      buff.writeUInt32LE(date.getTime() / 1000);
      await this.sendLoraxValueShort(
        LoraxCharacteristicPathMap[Characteristic.DEVICE_BIRTHDAY],
        buff
      );
    } else {
      await this.writeRawValue(
        Characteristic.DEVICE_BIRTHDAY,
        new Uint8Array(pack(date.getTime() / 1000, { bits: 32 }))
      );
    }
  }

  async switchProfile(profile: number) {
    if (this.isLorax) {
      await this.sendCommand(
        new Uint8Array([profile - 1]),
        Characteristic.PROFILE_CURRENT
      );
    } else {
      await this.writeRawValue(
        Characteristic.PROFILE,
        new Uint8Array([profile - 1, 0, 0, 0])
      );
      await this.writeRawValue(
        Characteristic.PROFILE_CURRENT,
        DeviceProfile[profile]
      );
    }
  }

  async setBrightness(brightness: number) {
    if (this.isLorax) {
      await this.sendCommand(
        LightCommands.LIGHT_DEFAULT,
        Characteristic.LANTERN_COLOR
      );
      await this.sendCommand(
        LightCommands.LANTERN_ON,
        Characteristic.LANTERN_START
      );
      brightness = Number((((brightness - 0) * (255 - 0)) / 100).toFixed(0));
      await this.sendCommand(
        new Uint8Array(new Array(4).fill(0).map(() => brightness)),
        Characteristic.LED_BRIGHTNESS
      );
      await new Promise((resolve) => setTimeout(() => resolve(true), 1000));
      await this.sendCommand(
        LightCommands.LANTERN_OFF,
        Characteristic.LANTERN_START
      );
    } else {
      await this.writeRawValue(
        Characteristic.LANTERN_COLOR,
        LightCommands.LIGHT_DEFAULT.OLD
      );
      await this.writeRawValue(
        Characteristic.LANTERN_START,
        LightCommands.LANTERN_ON.OLD
      );
      brightness = Number((((brightness - 0) * (255 - 0)) / 100).toFixed(0));
      await this.writeRawValue(
        Characteristic.LED_BRIGHTNESS,
        new Uint8Array(new Array(4).fill(0).map(() => brightness))
      );
      await new Promise((resolve) => setTimeout(() => resolve(true), 1000));
      await this.writeRawValue(
        Characteristic.LANTERN_START,
        LightCommands.LANTERN_OFF.OLD
      );
    }
  }

  async setLightMode(mode: PuffLightMode) {
    switch (mode) {
      case PuffLightMode.QueryReady: {
        if (this.isLorax) {
          await this.sendCommand(
            LightCommands.LIGHT_QUERY_READY,
            Characteristic.LANTERN_COLOR
          );
          await this.sendCommand(
            LightCommands.LANTERN_ON,
            Characteristic.LANTERN_START
          );
        } else {
          await this.writeRawValue(
            Characteristic.LANTERN_COLOR,
            LightCommands.LIGHT_QUERY_READY.OLD
          );
          await this.writeRawValue(
            Characteristic.LANTERN_START,
            LightCommands.LANTERN_ON.OLD
          );
        }
        break;
      }
      case PuffLightMode.MarkedReady: {
        if (this.isLorax) {
          await this.sendCommand(
            LightCommands.LIGHT_MARKED_READY,
            Characteristic.LANTERN_COLOR
          );
          await this.sendCommand(
            LightCommands.LANTERN_ON,
            Characteristic.LANTERN_START
          );
        } else {
          await this.writeRawValue(
            Characteristic.LANTERN_COLOR,
            LightCommands.LIGHT_MARKED_READY.OLD
          );
          await this.writeRawValue(
            Characteristic.LANTERN_START,
            LightCommands.LANTERN_ON.OLD
          );
        }
        break;
      }
      case PuffLightMode.Default: {
        if (this.isLorax) {
          await this.sendCommand(
            LightCommands.LANTERN_OFF,
            Characteristic.LANTERN_START
          );
          await this.sendCommand(
            LightCommands.LIGHT_NEUTRAL,
            Characteristic.LANTERN_COLOR
          );
        } else {
          await this.writeRawValue(
            Characteristic.LANTERN_START,
            LightCommands.LANTERN_OFF.OLD
          );
          await this.writeRawValue(
            Characteristic.LANTERN_COLOR,
            LightCommands.LIGHT_NEUTRAL.OLD
          );
        }
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

      const colorCall = await this.getValue(
        DynamicLoraxCharacteristics[Characteristic.PROFILE_COLOR](idx)
      );

      const intensityCall = await this.getValue(
        DynamicLoraxCharacteristics.PROFILE_INTENSITY(idx)
      );

      const temp = Number(temperatureCall.readFloatLE(0).toFixed(0));
      const time = Number(timeCall.readFloatLE(0).toFixed(0));
      const intensity = intensityCall.readFloatLE(0);
      const color =
        "#" +
        colorCall.readUInt8(0).toString(16) +
        colorCall.readUInt8(1).toString(16) +
        colorCall.readUInt8(2).toString(16);

      console.log(
        `%c${this.device.name}%c Profile #${
          idx + 1
        } - ${name} - ${temp} - ${time} (I: ${intensity})`,
        `padding: 10px; font-size: 1em; line-height: 1.4em; color: white; background: ${color}; border-radius: 15px;`,
        "font-size: 1em;"
      );
      profiles[idx + 1] = {
        name,
        temp,
        color,
        time: millisToMinutesAndSeconds(time * 1000),
        intensity,
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
    for await (const idx of [0, 1, 2, 3]) {
      const key = (idx + profileCurrent) % DeviceProfileReverse.length;
      await this.sendCommand(
        new Uint8Array([key, 0, 0, 0]),
        Characteristic.PROFILE
      );
      const profileName = await this.getValue(Characteristic.PROFILE_NAME);
      const name = profileName.toString();

      const profileColor = await this.getValue(Characteristic.PROFILE_COLOR);
      const color =
        "#" +
        profileColor.readUInt8(0).toString(16) +
        profileColor.readUInt8(1).toString(16) +
        profileColor.readUInt8(2).toString(16);

      const temperatureCall = await this.getValue(
        Characteristic.PROFILE_PREHEAT_TEMP
      );
      const timeCall = await this.getValue(Characteristic.PROFILE_PREHEAT_TIME);
      const temp = Number(temperatureCall.readFloatLE(0).toFixed(0));
      const time = Number(timeCall.readFloatLE(0).toFixed(0));

      console.log(
        `%c${this.device.name}%c Profile #${
          idx + 1
        } - ${name} - ${temp} - ${time}`,
        `padding: 10px; font-size: 1em; line-height: 1.4em; color: white; background: ${color}; border-radius: 15px;`,
        "font-size: 1em;"
      );
      profiles[key + 1] = {
        name,
        temp,
        color,
        time: millisToMinutesAndSeconds(time * 1000),
      };
    }

    return profiles;
  }

  private async pollValue(
    characteristic: string[] | string,
    time?: number
  ): Promise<EventEmitter> {
    if (typeof characteristic == "string") characteristic = [characteristic];
    if (!time) time = 10000; // 10s

    const listener = new EventEmitter();
    let suspended = false;

    for await (const name of characteristic) {
      time = time + Math.floor(Math.random() * 700) + 125;
      const char = await this.service
        .getCharacteristic(name)
        .then((char) => char)
        .catch(() => null);

      const func = this.isLorax
        ? async () => {
            const value = await this.getValue(name);
            listener.emit("change", value, name);
            listener.emit("data", value, name);
          }
        : async () => {
            try {
              const value = await char?.readValue();
              listener.emit("data", Buffer.from(value.buffer), name);
              listener.emit("change", Buffer.from(value.buffer), name);
            } catch (error) {}
          };

      func();
      const int = setInterval(
        () =>
          suspended ? console.log(`DEBUG: Poller ${name} suspended`) : func(),
        time
      );

      listener.on("suspend", () => {
        console.log(`DEBUG: Suspending poller for ${name}`);
        suspended = true;
      });

      listener.on("resume", () => {
        console.log(`DEBUG: Resuming poller for ${name}`);
        suspended = false;
      });

      listener.on("stop", () => {
        console.log(`DEBUG: Stopping poller for ${name}`);
        listener.removeAllListeners();
        clearInterval(int);
      });
    }

    return listener;
  }

  disconnect() {
    const pollers = ["led", "chamberTemp", "batteryProfile", "totalDabs"];

    for (const name of pollers) {
      const poller = this.pollerMap.get(name);
      if (poller) {
        this.pollerMap.delete(name);
        poller.emit("stop");
      }
    }

    if (this.server) this.server.disconnect();

    this.lastLoraxSequenceId = 0;
    this.loraxLimits = { maxCommands: 0, maxFiles: 0, maxPayload: 0 };
    this.loraxMessages = new Map();
    this.pollerMap = new Map();
    this.watchMap = new Map();
    this.pathWatchers = new Map();
    this.sendingCommand = false;

    delete this.poller;
    delete this.server;
    delete this.service;
    delete this.device;

    delete this.deviceFirmware;
    delete this.deviceName;
    delete this.deviceMacAddress;
    delete this.deviceSerialNumber;
    delete this.deviceModel;

    delete this.currentProfileId;
    delete this.chamberType;
    delete this.gitHash;
    delete this.isPup;
    delete this.isLorax;
    delete this.hardwareVersion;
    delete this.profiles;

    delete this.lastOperatingStateUpdate;

    if (this.watcherSuspendTimeout) clearTimeout(this.watcherSuspendTimeout);
    delete this.watcherSuspendTimeout;
  }
}
