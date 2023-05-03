import { createHash } from "crypto";
import { EventEmitter } from "events";
import { unpack, pack } from "byte-data";
import { GatewayMemberDeviceState } from "../../types/gateway";
import {
  convertFromHex,
  convertHexStringToNumArray,
  millisToMinutesAndSeconds,
  decimalToHexString,
  hexToFloat,
  constructLoraxCommand,
  processLoraxReply,
  intArrayToMacAddress,
  readShortCmd,
  writeShortCmd,
  numbersToLetters,
} from "../functions";
import { DeviceInformation, DiagData } from "../../types/api";
import { trackDiags } from "../hash";
import { LoraxLimits, LoraxMessage, PuffcoProfile } from "../../types/puffco";
import { gateway } from "../gateway";
import {
  Characteristic,
  LoraxCommands,
  LoraxCharacteristic,
  DeviceCommand,
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
} from "./constants";

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

  lastLoraxSequenceId: number;
  loraxMessages: Map<number, LoraxMessage>;
  loraxLimits: LoraxLimits;

  isPup: boolean;
  isLorax: boolean;

  gitHash: string;
  deviceName: string;
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
          window["LoraxCommands"] = LoraxCommands;
          window["LoraxCharacteristic"] = LoraxCharacteristic;
          window["Characteristic"] = Characteristic;
          window["unpack"] = unpack;
          window["pack"] = pack;
          window["hexToFloat"] = hexToFloat;
          window["decimalToHexString"] = decimalToHexString;
          window["DeviceCommand"] = DeviceCommand;
          window["constructLoraxCommand"] = constructLoraxCommand;
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

    const initDeviceMac = await this.getValue(Characteristic.BT_MAC);
    deviceInfo.mac = intArrayToMacAddress(initDeviceMac);
    initState.deviceMac = deviceInfo.mac;

    const initChamberType = await this.getValue(Characteristic.CHAMBER_TYPE);
    initState.chamberType = initChamberType.readUInt8(0);

    let currentChargingState: number;
    const chargingPoll = await this.pollValue(
      Characteristic.BATTERY_CHARGE_SOURCE,
      4,
      2200
    );
    chargingPoll.on("change", (data: Buffer) => {
      if (!data || data.byteLength != (this.isLorax ? 1 : 4)) return;
      const val = Number(
        (this.isLorax ? data.readUInt8(0) : data.readFloatLE(0)).toFixed(0)
      );
      if (val != currentChargingState)
        this.poller.emit("data", {
          chargeSource: val,
        });
      currentChargingState = val;
    });

    let currentBattery: number;
    const batteryPoll = await this.pollValue(
      Characteristic.BATTERY_SOC,
      4,
      2700
    );
    batteryPoll.on("change", (data: Buffer) => {
      if (!data || data.byteLength != 4) return;
      const val = Number(data.readFloatLE(0).toFixed(0));
      if (val != currentBattery)
        this.poller.emit("data", {
          battery: val,
        });
      currentBattery = val;
    });

    let currentOperatingState: number;
    const operatingState = await this.pollValue(
      Characteristic.OPERATING_STATE,
      0,
      this.isLorax ? 555 : 1200
    );
    operatingState.on("change", (data: Buffer) => {
      if (!data || data.byteLength != (this.isLorax ? 1 : 4)) return;
      const val = this.isLorax ? data.readUInt8(0) : data.readFloatLE(0);
      if (val != currentOperatingState)
        this.poller.emit("data", { state: val });
      currentOperatingState = val;
    });

    let currentChamberType: number;
    const chamberType = await this.pollValue(
      Characteristic.CHAMBER_TYPE,
      0,
      1150
    );
    chamberType.on("change", (data: Buffer) => {
      if (!data || data.byteLength != 1) return;
      const val = data.readUInt8(0);
      if (val != currentChamberType)
        this.poller.emit("data", {
          chamberType: val,
        });
      currentChamberType = val;
    });

    let currentLedColor: { r: number; g: number; b: number };
    const aciveLEDPoll = await this.pollValue(
      Characteristic.ACTIVE_LED_COLOR,
      4,
      1150
    );
    aciveLEDPoll.on("data", (data: Buffer) => {
      if (!data || data.byteLength != 8) return;
      const r = data.readUInt8(0);
      const g = data.readUInt8(1);
      const b = data.readUInt8(2);
      if (JSON.stringify(currentLedColor) != JSON.stringify({ r, g, b }))
        this.poller.emit("data", { activeColor: { r, g, b } });
      currentLedColor = { r, g, b };
    });

    let lastBrightness: number;
    const brightnessPoll = await this.pollValue(
      Characteristic.LED_BRIGHTNESS,
      1,
      9000
    );
    brightnessPoll.on("change", (data: Buffer) => {
      if (!data || data.byteLength != 4) return;
      // const ringLed = data.readUInt8(0);
      // const underglassLed = data.readUInt8(1);
      const mainLed = data.readUInt8(2);
      // const batteryLed = data.readUInt8(3);

      const val = Number(mainLed.toFixed(0));

      if (val != lastBrightness)
        this.poller.emit("data", {
          brightness: val,
        });
      lastBrightness = val;
    });

    let lastDabs: number;
    const totalDabsPoll = await this.pollValue(
      Characteristic.TOTAL_HEAT_CYCLES,
      0,
      this.isLorax ? 750 : 2000
    );
    totalDabsPoll.on("data", (data: Buffer) => {
      if (!data || data.byteLength != 4) return;
      const conv = Number(data.readFloatLE(0));
      if (lastDabs != conv)
        this.poller.emit("data", {
          totalDabs: conv,
        });
      lastDabs = conv;
    });

    let lastTemp: number;
    const tempPoll = await this.pollValue(
      Characteristic.HEATER_TEMP,
      0,
      this.isLorax ? 200 : 1200
    ); // Make this dynamic based on state
    tempPoll.on("data", async (data: Buffer) => {
      if (!data || data.byteLength != 4) return;
      const conv = Number(data.readFloatLE(0).toFixed(0));
      if (lastTemp != conv && conv < 1000 && conv > 1)
        this.poller.emit("data", { temperature: conv });
      lastTemp = conv;
    });

    const currentProfilePoll = await this.pollValue(
      Characteristic.PROFILE_CURRENT,
      0,
      1150
    );
    currentProfilePoll.on("data", async (data: Buffer) => {
      if (!data || data.byteLength != (this.isLorax ? 1 : 4)) return;
      const profileCurrent = this.isLorax
        ? data.readUInt8(0)
        : data.readFloatLE(0);
      if (profileCurrent != this.currentProfileId)
        this.poller.emit("data", {
          profile: this.profiles[profileCurrent + 1],
        });
      this.currentProfileId = profileCurrent;
    });

    const deviceNamePoll = await this.pollValue(
      Characteristic.DEVICE_NAME,
      1,
      10500
    );
    deviceNamePoll.on("change", (data: Buffer) => {
      if (!data) return;
      const name = data.toString();
      if (name != this.deviceName)
        this.poller.emit("data", { deviceName: name });
      this.deviceName = name;
    });

    this.poller.on("stop", (disconnect = true) => {
      const pollers = [
        chargingPoll,
        batteryPoll,
        operatingState,
        chamberType,
        aciveLEDPoll,
        brightnessPoll,
        totalDabsPoll,
        tempPoll,
        currentProfilePoll,
        deviceNamePoll,
      ];
      for (const poller of pollers) poller.emit("stop");

      if (this.server.connected && disconnect) this.server.disconnect();
      this.poller.removeAllListeners();
    });

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
      console.log(
        "There was an error with writeValueWithoutResponse",
        message,
        error
      );
      return;
    }
  }

  private async getLoraxValueShort(path: string) {
    const command = readShortCmd(this.loraxLimits, path);
    return await this.sendLoraxCommand(LoraxCommands.READ_SHORT, command, path);
  }

  async sendLoraxValueShort(path: string, data: Buffer) {
    const command = writeShortCmd(path, data);
    await this.sendLoraxCommand(LoraxCommands.WRITE_SHORT, command, path);
  }

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
    command: { LORAX: Uint8Array; OLD: Uint8Array } | Uint8Array,
    characteristic?: string
  ) {
    if (!this.service) return;
    if (this.isLorax)
      await this.sendLoraxValueShort(
        LoraxCharacteristicPathMap[characteristic || Characteristic.COMMAND],
        Buffer.from("LORAX" in command ? command.LORAX : command)
      );
    else
      await this.writeRawValue(
        characteristic || Characteristic.COMMAND,
        "OLD" in command ? command.OLD : command
      );
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
      // await this.sendLoraxValueShort(
      //   Characteristic.DEVICE_BIRTHDAY,
      //   new Uint8Array(pack(date.getTime() / 1000, { bits: 32 }))
      // );
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
    for await (const idx of [0, 1, 2, 3]) {
      const key = (idx + profileCurrent) % DeviceProfileReverse.length;
      await this.sendCommand(
        new Uint8Array([key, 0, 0, 0]),
        Characteristic.PROFILE
      );
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
    time = time + Math.floor(Math.random() * 100) + 50; // Make this jitter higher on android only
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
          try {
            const value = await char?.readValue();
            listener.emit("data", Buffer.from(value.buffer));
            listener.emit("change", Buffer.from(value.buffer));
          } catch (error) {}
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
  }
}
