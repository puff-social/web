import { createHash } from "crypto";
import { EventEmitter } from "events";
import { pack } from "byte-data";
import { GroupState } from "../../types/gateway";
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
  isOtaValid,
} from "../functions";
import { DeviceInformation, DiagData } from "../../types/api";
import { trackDiags } from "../hash";
import {
  AuditLogEntry,
  LoraxLimits,
  LoraxMessage,
  PuffcoProfile,
} from "../../types/puffco";
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
  PUP_TRIGGER_CHAR,
  SILLABS_CONTROL,
  PUP_COMMAND_RESPONSE_CHAR,
  PUP_DEVICE_INFO,
  PUP_GENERAL_COMMAND_CHAR,
  SILLABS_DATA_CHAR,
  PUP_SERIAL_NUMBER_CHAR,
} from "./constants";
import { store } from "../../state/store";
import { GroupState as GroupStateInterface } from "../../state/slices/group";
import {
  PuffcoOperatingState,
  AuditLogCode,
  GatewayDeviceLastDab,
  DeviceState,
} from "@puff-social/commons/dist/puffco";
import { Op } from "@puff-social/commons/dist/constants";
import { setProgress } from "../../state/slices/updater";
import { setBleConnectionModalOpen } from "../../state/slices/desktop";
import { isElectron } from "../electron";
import { HeatCycleOffset } from "./audit";

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
  auditLogEntries: Map<number, AuditLogEntry>;
  loraxMessages: Map<number, LoraxMessage>;
  loraxLimits: LoraxLimits;

  deviceInfo: Partial<DeviceInformation>;
  initState: Partial<DeviceState>;

  auditOffset: number;
  faultOffset: number;

  isOta: boolean;
  isPup: boolean;
  isSillabs: boolean;
  isLorax: boolean;
  hasService: boolean;

  pollerSuspended: boolean;
  sendingCommand: boolean;

  operatingState: number;
  lastOperatingStateUpdate: Date;

  gitHash: string;
  utcTime: number;
  deviceName: string;
  chamberType: number;
  deviceModel: string;
  hardwareVersion: number;
  deviceFirmware: string;
  deviceSerialNumber: string;
  deviceMacAddress: string;
  currentProfileId: number;

  pupWriteNotifications: EventEmitter;
  otaBlockSize: number;
  pupChunkSize: number;
  pupWriteTimeout: number;
  pupVerifyTimeout: number;

  maxBytesPerSecond: number;

  disconnected: boolean;
  reconnectionAttempts: number;
  allowReconnection: boolean;
  resetReconnectionsTimer: NodeJS.Timeout;

  lastHeatCycleCompleted: GatewayDeviceLastDab;
  lastChargeCompleted: Date;

  registeredDisconnectHandler: () => void;

  on(event: "clearWatchers", listener: () => void): this;
  on(
    event: "profiles",
    listener: (profiles: Record<number, PuffcoProfile>) => void
  ): this;
  on(event: "gattdisconnect", listener: () => void): this;
  on(
    event: "device_connected",
    listener: (device: BluetoothDevice) => void
  ): this;
  on(
    event: "gatt_connected",
    listener: (server: BluetoothRemoteGATTServer) => void
  ): this;
  on(event: "reconnecting", listener: () => void): this;
  on(event: "reconnected", listener: () => void): this;
  on(event: "inited", listener: () => void): this;

  on(event: "device_last_heat_completed", listener: (date: Date) => void): this;
  on(
    event: "device_last_charge_completed",
    listener: (date: Date) => void
  ): this;
}

export class Device extends EventEmitter {
  constructor() {
    super();
    this.lastLoraxSequenceId = 0;
    this.loraxLimits = { maxCommands: 0, maxFiles: 0, maxPayload: 0 };
    this.auditLogEntries = new Map();
    this.loraxMessages = new Map();
    this.pollerMap = new Map();
    this.watchMap = new Map();
    this.pathWatchers = new Map();
    this.sendingCommand = false;
    this.reconnectionAttempts = 0;
    this.disconnected = true;
    this.allowReconnection = false;

    this.auditOffset = 0;
    this.faultOffset = 0;
  }

  async handleAuthentication() {
    if (this.isLorax) {
      // This triggers pairing on lorax ;P
      if (this.isPup) {
        const pupVer = await this.pupService.getCharacteristic(PUP_APP_VERSION);
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
                  newKey,
                  null,
                  true
                );

                break;
              }

              case LoraxCommands.UNLOCK_ACCESS: {
                if (msg.response.error) {
                  console.log("error unlocking");
                  return;
                }

                console.log(
                  `%c${this.device.name}%c Lorax: Authenticated`,
                  `padding: 10px; font-size: 1em; line-height: 1.4em; color: white; background: #000000; border-radius: 15px;`,
                  "font-size: 1em;"
                );

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

                  this.sendLoraxCommand(
                    LoraxCommands.GET_ACCESS_SEED,
                    null,
                    null,
                    true
                  );
                }

                break;
              }
            }
          }
        );
        await this.loraxReply.startNotifications();

        this.sendLoraxCommand(LoraxCommands.GET_LIMITS, null, null, true);
      });

      const modelRaw = await this.getValue(Characteristic.HARDWARE_MODEL);
      this.deviceModel = modelRaw.readUInt32LE(0).toString();

      const hardwareVersion = await this.getValue(
        Characteristic.HARDWARE_VERSION
      );
      this.hardwareVersion = hardwareVersion.readUInt8(0);

      const firmwareRaw = await this.getValue(Characteristic.FIRMWARE_VERSION);
      this.deviceFirmware = numbersToLetters(firmwareRaw.readUInt8(0) + 5);

      await this.loraxProfiles(false);
    } else {
      const accessSeedKey = await this.service.getCharacteristic(
        Characteristic.ACCESS_KEY
      );
      const value = await accessSeedKey.readValue();

      const decodedKey = new Uint8Array(16);
      for (let i = 0; i < 16; i++) decodedKey[i] = value.getUint8(i);

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

      this.profiles = await this.loopProfiles();
    }
  }

  async setupWatchers() {
    for await (const path of [
      LoraxCharacteristicPathMap[Characteristic.OPERATING_STATE],
    ]) {
      try {
        await this.watchWithConfirmation(path);

        const int = setInterval(async () => {
          if (
            new Date().getTime() - this.lastOperatingStateUpdate?.getTime() >
            intMap[path] * 2
          ) {
            console.log(
              "DEBUG: Deviation for",
              path,
              "is beyond 2x, unwatching and rewatching",
              `(D: ${
                new Date().getTime() - this.lastOperatingStateUpdate.getTime()
              })`
            );

            await Promise.race([
              await this.unwatchPath(path),
              await new Promise((resolve) => {
                setTimeout(() => resolve(1), 500);
              }),
            ]);
            setTimeout(() => {
              this.watchPath(path, intMap[path]);
            }, 500);
          }
        }, intMap[path]);

        this.once("gattdisconnect", () => {
          if (int) clearInterval(int);
        });

        this.once("clearWatchers", () => {
          if (int) clearInterval(int);
        });
      } catch (error) {
        continue;
      }
      await new Promise((resolve) => setTimeout(() => resolve(true), 200));
    }
  }

  async setupDevice() {
    if (this.isLorax) {
      this.loraxEvent = await this.service.getCharacteristic(
        LoraxCharacteristic.EVENT
      );

      delete this.lastOperatingStateUpdate;
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

          if (!reply.data || reply.data.byteLength == 0) return;

          switch (path) {
            case LoraxCharacteristicPathMap[Characteristic.OPERATING_STATE]: {
              this.lastOperatingStateUpdate = new Date();
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
                  this.watcherSuspendTimeout = setTimeout(async () => {
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
              if (reply.data.byteLength != 4) return;

              const conv = Number(reply.data.readFloatLE(0));
              if (lastElapsedTime != conv) {
                this.poller.emit("data", {
                  stateTime: conv,
                });
                lastElapsedTime = conv;
              }
              break;
            }
            case LoraxCharacteristicPathMap[Characteristic.HEATER_TEMP]: {
              if (reply.data.byteLength != 4) return;

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

      this.setupWatchers();
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

        delete this.poller;
      });
    }
  }

  async disconnectHandler() {
    try {
      if (this.reconnectionAttempts >= 3) {
        console.log(
          "Reconnection failed after 3 attempts, gatt server disconnected"
        );
        this.emit("gattdisconnect");
        if (!this.disconnected) this.disconnect();
        return;
      }

      if (this.allowReconnection && this.device) {
        this.disconnected = true;
        this.emit("reconnecting");
        console.log(
          "reconnecting",
          this.allowReconnection,
          this.server,
          this.disconnected
        );

        await new Promise((resolve) => setTimeout(() => resolve(1), 100));

        this.emit("clearWatchers");

        this.pollerSuspended = true;
        this.lastLoraxSequenceId = 0;
        this.auditLogEntries = new Map();
        this.loraxMessages = new Map();
        this.watchMap = new Map();
        this.pathWatchers = new Map();
        this.sendingCommand = false;

        this.server = await Promise.race([
          this.device.gatt.connect(),
          new Promise<never>((_, reject) => {
            setTimeout(() => reject("timed_out"), 5 * 1000);
          }),
        ]);

        const primaryServices = await this.server.getPrimaryServices();

        this.isLorax = !!primaryServices.find(
          (service) => service.uuid == LORAX_SERVICE
        );
        this.isPup = !!primaryServices.find(
          (service) => service.uuid == PUP_SERVICE
        );

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

        this.service = await this.server.getPrimaryService(
          this.isLorax ? LORAX_SERVICE : SERVICE
        );

        await this.handleAuthentication().catch(() =>
          this.handleAuthentication().catch(() => this.handleAuthentication())
        );

        await this.setupDevice();
        this.emit("gatt_connected", this.server);
        this.emit("reconnected", this.device);
        this.disconnected = false;
        this.pollerSuspended = false;

        if (this.resetReconnectionsTimer)
          clearTimeout(this.resetReconnectionsTimer);
        this.resetReconnectionsTimer = setTimeout(() => {
          if (!this.disconnected) this.reconnectionAttempts = 0;
        }, 10 * 1000);
      } else {
        this.emit("gattdisconnect");
        if (!this.disconnected) this.disconnect();
      }
    } catch (error) {
      console.log("Error", error, error.toString());
      this.reconnectionAttempts = (this.reconnectionAttempts || 0) + 1;

      this.disconnectHandler();
    }
  }

  initOta(): Promise<{
    device: BluetoothDevice;
    mac: string;
    hash: string;
  }> {
    return new Promise(async (resolve, reject) => {
      try {
        this.isOta = true;
        this.device = await navigator.bluetooth.requestDevice({
          filters: [
            {
              services: [PUP_SERVICE],
            },
            {
              services: [SERVICE],
            },
            {
              services: [LORAX_SERVICE],
            },
            { name: "Peak2OTA" },
            { name: "AppLoader" },
            { namePrefix: "000B57" },
            { namePrefix: "003C84" },
            { namePrefix: "040D84" },
            { namePrefix: "04CD15" },
            { namePrefix: "086BD7" },
            { namePrefix: "0C4314" },
            { namePrefix: "14B457" },
            { namePrefix: "2C1165" },
            { namePrefix: "50325F" },
            { namePrefix: "540F57" },
            { namePrefix: "588E81" },
            { namePrefix: "5C0272" },
            { namePrefix: "60A423" },
            { namePrefix: "680AE2" },
            { namePrefix: "804B50" },
            { namePrefix: "842E14" },
            { namePrefix: "847127" },
            { namePrefix: "84BA20" },
            { namePrefix: "84FD27" },
            { namePrefix: "8CF681" },
            { namePrefix: "9035EA" },
            { namePrefix: "90FD9F" },
            { namePrefix: "94DEB8" },
            { namePrefix: "B4E3F9" },
            { namePrefix: "BC33AC" },
            { namePrefix: "CC86EC" },
            { namePrefix: "CCCCCC" },
            { namePrefix: "EC1BBD" },
          ],
          optionalServices: [
            Characteristic.MODEL_SERVICE,
            SILLABS_OTA_SERVICE,
            LORAX_SERVICE,
            PUP_SERVICE,
          ],
        });

        this.server = await this.device.gatt.connect();

        this.pupWriteNotifications = new EventEmitter();
        this.otaBlockSize = 20;
        this.pupChunkSize = 30;
        this.pupWriteTimeout = 30;
        this.pupVerifyTimeout = 300;
        this.maxBytesPerSecond = 2000;

        const primaryServices = await this.server.getPrimaryServices();

        this.isLorax = !!primaryServices.find(
          (service) => service.uuid == LORAX_SERVICE
        );
        this.isPup = !!primaryServices.find(
          (service) => service.uuid == PUP_SERVICE
        );
        this.isSillabs = !!primaryServices.find(
          (service) => service.uuid == SILLABS_OTA_SERVICE
        );
        this.hasService = !!primaryServices.find((service) =>
          [LORAX_SERVICE, SERVICE].includes(service.uuid)
        );

        if (this.isSillabs)
          this.silabsService = await this.server.getPrimaryService(
            SILLABS_OTA_SERVICE
          );
        if (this.isPup)
          this.pupService = await this.server.getPrimaryService(PUP_SERVICE);

        if (this.hasService) {
          this.service = await this.server.getPrimaryService(
            this.isLorax ? LORAX_SERVICE : SERVICE
          );

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

            if (this.hasService) {
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
                        console.log(
                          `%c${this.device.name}%c Lorax: Authenticated`,
                          `padding: 10px; font-size: 1em; line-height: 1.4em; color: white; background: #000000; border-radius: 15px;`,
                          "font-size: 1em;"
                        );

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
                          this.loraxLimits.maxCommands =
                            data.data.readUInt16LE(2);

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

              const modelRaw = await this.getValue(
                Characteristic.HARDWARE_MODEL
              );
              this.deviceModel = modelRaw.readUInt32LE(0).toString();

              const hardwareVersion = await this.getValue(
                Characteristic.HARDWARE_VERSION
              );
              this.hardwareVersion = hardwareVersion.readUInt8(0);

              const firmwareRaw = await this.getValue(
                Characteristic.FIRMWARE_VERSION
              );
              this.deviceFirmware = numbersToLetters(
                firmwareRaw.readUInt8(0) + 5
              );

              const gitHashRaw = await this.getValue(Characteristic.GIT_HASH);
              this.gitHash = gitHashRaw.toString();

              const btMac = await this.getValue(Characteristic.BT_MAC);
              this.deviceMacAddress = intArrayToMacAddress(btMac);
            }
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
          }
        }

        this.device.addEventListener("gattserverdisconnected", () => {
          this.emit("gattdisconnect");

          this.disconnect();
        });

        resolve({
          device: this.device,
          mac: this.deviceMacAddress,
          hash: this.gitHash,
        });
      } catch (error) {
        this.disconnect();
        reject(error);
      }
    });
  }

  init(): Promise<{
    profiles: Record<number, PuffcoProfile>;
    device: BluetoothDevice;
  }> {
    return new Promise(async (resolve, reject) => {
      try {
        try {
          this.allowReconnection = false;
          if (isElectron()) store.dispatch(setBleConnectionModalOpen(true));

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

          this.emit("device_connected", this.device);
        } catch (error) {
          if (isElectron()) store.dispatch(setBleConnectionModalOpen(false));

          this.disconnect();
          return reject(error);
        }

        this.server = await this.device.gatt.connect();
        this.emit("gatt_connected", this.server);

        this.disconnected = false;

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

        this.registeredDisconnectHandler = () => {
          this.disconnectHandler.bind(this)();
        };

        this.device.addEventListener(
          "gattserverdisconnected",
          this.registeredDisconnectHandler
        );

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

        await this.handleAuthentication();

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
              Characteristic.SERIAL_NUMBER,
              true
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

          this.emit("profiles", this.profiles || {});
          this.emit("inited", this.device);

          (async () => {
            await this.readDeviceAuditLogs({ reverse: true });
            console.log("Read device", this.auditLogEntries);
          })();

          resolve({
            device: this.device,
            profiles: this.profiles || {},
          });
        } catch (error) {
          console.error(`Failed to track diags: ${error}`);
        }
      } catch (error) {
        if (isElectron()) store.dispatch(setBleConnectionModalOpen(false));

        if (this.server) this.server.disconnect();
        this.disconnect();
        console.error(error);
        reject(error);
      }
    });
  }

  async watchPath(path: string, int: number, len?: number) {
    if (!this.server || !this.server.connected) return;
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
    if (!this.server || !this.server.connected) return;
    const watch = this.pathWatchers.get(path);

    const unwatch = closeCmd(watch);
    await this.sendLoraxCommand(LoraxCommands.CLOSE, unwatch, path);

    this.watchMap.delete(watch);
    this.pathWatchers.delete(path);
    return watch;
  }

  async unwatchPath(path: string) {
    if (!this.server || !this.server.connected) return;
    const close = await this.closePath(path);

    const unwatch = unwatchCmd(close);
    const cmd = await this.sendLoraxCommand(LoraxCommands.WATCH, unwatch, path);

    return cmd;
  }

  async startPolling() {
    this.poller = new EventEmitter();
    if (!this.service || !this.server || !this.server.connected) return;

    const initState: Partial<DeviceState> = {};
    const deviceInfo: Partial<DeviceInformation> = {};

    initState.deviceModel = this.deviceModel;
    deviceInfo.model = this.deviceModel;
    deviceInfo.firmware = this.deviceFirmware;
    deviceInfo.hardware = this.hardwareVersion;
    deviceInfo.gitHash = this.gitHash;

    const initTemperature = await this.getValue(
      Characteristic.HEATER_TEMP,
      true
    );
    initState.temperature = Number(initTemperature.readFloatLE(0).toFixed(0));

    const initActiveColor = await this.getValue(
      Characteristic.ACTIVE_LED_COLOR
    );

    initState.activeColor = {
      r: initActiveColor.readUInt8(0),
      g: initActiveColor.readUInt8(1),
      b: initActiveColor.readUInt8(2),
    };

    const initBrightness = await this.getValue(
      Characteristic.LED_BRIGHTNESS,
      true
    );
    initState.brightness = Number(
      (((Number(initBrightness.readUInt8(0)) - 0) / (255 - 0)) * 100).toFixed(0)
    );

    const initBattery = await this.getValue(Characteristic.BATTERY_SOC, true);
    initState.battery = Number(initBattery.readFloatLE(0).toFixed(0));

    const initStateState = await this.getValue(
      Characteristic.OPERATING_STATE,
      true
    );
    initState.state = this.isLorax
      ? initStateState.readUInt8(0)
      : initStateState.readFloatLE(0);

    const initStateTime = await this.getValue(
      Characteristic.STATE_ELAPSED_TIME,
      true
    );
    initState.stateTime = Number(initStateTime.readFloatLE(0));

    const initChargeSource = await this.getValue(
      Characteristic.BATTERY_CHARGE_SOURCE,
      true
    );
    initState.chargeSource = Number(
      (this.isLorax
        ? initChargeSource.readUInt8(0)
        : initChargeSource.readFloatLE(0)
      ).toFixed(0)
    );

    const initTotalDabs = await this.getValue(
      Characteristic.TOTAL_HEAT_CYCLES,
      true
    );
    initState.totalDabs = Number(initTotalDabs.readFloatLE(0));
    deviceInfo.totalDabs = initState.totalDabs;

    const initDabsPerDay = await this.getValue(
      Characteristic.DABS_PER_DAY,
      true
    );

    deviceInfo.dabsPerDay = Number(initDabsPerDay.readFloatLE(0).toFixed(2));
    if (isNaN(deviceInfo.dabsPerDay)) deviceInfo.dabsPerDay = 0.0;
    initState.dabsPerDay = deviceInfo.dabsPerDay;

    const initDeviceName = await this.getValue(
      Characteristic.DEVICE_NAME,
      true
    );
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
        : Characteristic.PROFILE_NAME,
      true
    );

    const temperatureCall = await this.getValue(
      this.isLorax
        ? DynamicLoraxCharacteristics[Characteristic.PROFILE_PREHEAT_TEMP](
            this.currentProfileId
          )
        : Characteristic.PROFILE_PREHEAT_TEMP,
      true
    );
    const timeCall = await this.getValue(
      this.isLorax
        ? DynamicLoraxCharacteristics[Characteristic.PROFILE_PREHEAT_TIME](
            this.currentProfileId
          )
        : Characteristic.PROFILE_PREHEAT_TIME,
      true
    );
    const colorCall = await this.getValue(
      DynamicLoraxCharacteristics[Characteristic.PROFILE_COLOR](
        this.currentProfileId
      ),
      true
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
      Characteristic.DEVICE_BIRTHDAY,
      true
    );
    deviceInfo.dob = initDeviceBirthday.readUInt32LE(0);

    const initDeviceUTCTime = await this.getValue(
      Characteristic.UTC_TIME,
      true
    );
    this.utcTime = initDeviceUTCTime.readUInt32LE(0);

    const initDeviceMac = await this.getValue(Characteristic.BT_MAC, true);
    deviceInfo.mac = intArrayToMacAddress(initDeviceMac);
    initState.deviceMac = deviceInfo.mac;

    const initChamberType = await this.getValue(
      Characteristic.CHAMBER_TYPE,
      true
    );
    initState.chamberType = initChamberType.readUInt8(0);
    this.chamberType = initState.chamberType;

    this.setupDevice();

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

      delete this.poller;
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

    this.deviceInfo = deviceInfo;
    this.initState = initState;

    if (this.lastHeatCycleCompleted)
      this.initState.lastDab = this.lastHeatCycleCompleted;

    return { poller: this.poller, initState, deviceInfo };
  }

  private async writeLoraxCommand(message: Buffer) {
    if (!this.service || !this.server || !this.server.connected) return;

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

  private async getLoraxValueShort(path: string, retry?: boolean) {
    const command = readShortCmd(this.loraxLimits, path);
    return await this.sendLoraxCommand(
      LoraxCommands.READ_SHORT,
      command,
      path,
      retry
    );
  }

  async sendLoraxValueShort(path: string, data: Buffer, padding = true) {
    const command = writeShortCmd(path, data, padding);
    await this.sendLoraxCommand(LoraxCommands.WRITE_SHORT, command, path);
  }

  private async sendLoraxCommand(
    op: number,
    data: Uint8Array,
    path?: string,
    retry?: boolean
  ) {
    if (!this.service || !this.server || !this.server.connected) return;
    if (
      this.sendingCommand &&
      [
        LoraxCommands.WRITE_SHORT,
        LoraxCommands.WATCH,
        LoraxCommands.UNWATCH,
        LoraxCommands.OPEN,
        LoraxCommands.CLOSE,
        retry ? LoraxCommands.READ_SHORT : null,
      ].includes(op)
    ) {
      await new Promise((resolve) => setTimeout(() => resolve(1), 100));
      return this.sendLoraxCommand(op, data, path);
    } else if (this.sendingCommand) return;

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
    const func = async (attempt: number) => {
      if (attempt > 5) return;
      if (!this.service || !this.server || !this.server.connected) return;
      if (this.isLorax)
        await this.sendLoraxValueShort(
          LoraxCharacteristicPathMap[characteristic || Characteristic.COMMAND],
          Buffer.from("LORAX" in command ? command.LORAX : command)
        ).catch(() => {
          console.log("already in progress");
          attempts++;
          return func(attempts);
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
    if (!this.service || !this.server || !this.server.connected) return;

    const char = await this.service.getCharacteristic(characteristic);
    try {
      await char.writeValue(Buffer.from(value));
    } catch (error) {
      console.log("There was an error with writeValue", error);
    }
  }

  async getValue(
    characteristic: string,
    retry = false
  ): Promise<Buffer | undefined> {
    return new Promise(async (resolve, reject) => {
      if (this.isLorax) {
        try {
          const req = await this.getLoraxValueShort(
            LoraxCharacteristicPathMap[characteristic]
              ? LoraxCharacteristicPathMap[characteristic]
              : characteristic,
            retry
          );

          if (!req)
            return resolve(
              new Promise((res) =>
                setTimeout(() => res(this.getValue(characteristic, retry)), 50)
              )
            );

          const func = async (ev: Event) => {
            const {
              value: { buffer },
            }: { value: DataView } = ev.target as any;
            const data = processLoraxReply(buffer);
            const msg = this.loraxMessages.get(data.seq);
            if (msg) msg.response = { data: data.data, error: !!data.error };

            if (
              msg &&
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
    if (!this.server || !this.server.connected) return;
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

  async loraxProfiles(emit = true) {
    const profileCurrentRaw = await this.getValue(
      Characteristic.PROFILE_CURRENT
    );
    const profileCurrent = profileCurrentRaw.readUInt8(0);
    this.currentProfileId = profileCurrent;

    let profiles: Record<number, PuffcoProfile> = {};
    for await (const idx of [0, 1, 2, 3]) {
      const profileName = await this.getValue(
        DynamicLoraxCharacteristics[Characteristic.PROFILE_NAME](idx),
        true
      );
      const name = profileName.toString();

      const temperatureCall = await this.getValue(
        DynamicLoraxCharacteristics[Characteristic.PROFILE_PREHEAT_TEMP](idx),
        true
      );

      const timeCall = await this.getValue(
        DynamicLoraxCharacteristics[Characteristic.PROFILE_PREHEAT_TIME](idx),
        true
      );

      const colorCall = await this.getValue(
        DynamicLoraxCharacteristics[Characteristic.PROFILE_COLOR](idx),
        true
      );

      const intensityCall = await this.getValue(
        DynamicLoraxCharacteristics.PROFILE_INTENSITY(idx),
        true
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

    this.profiles = profiles;
    if (emit) this.emit("profiles", profiles);

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
        () => (suspended ? () => {} : this.pollerSuspended ? () => {} : func()),
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

  async rebootToAppLoader() {
    if (!this.pupService && !this.silabsService)
      throw { code: "not_implemented" };

    const socService = this.pupService || this.silabsService;

    const socControl = await socService.getCharacteristic(
      this.isPup ? PUP_TRIGGER_CHAR : SILLABS_CONTROL
    );

    const buf = Buffer.alloc(1);
    buf.writeUInt8(0, 0);

    await socControl.writeValue(buf);
  }

  async readOtaSerialNumber() {
    if (!this.isPup) throw { code: "not_implemented" };

    const char = await this.pupService.getCharacteristic(
      PUP_SERIAL_NUMBER_CHAR
    );
    const value = await char.readValue();

    this.deviceSerialNumber = value.toString();

    console.log(this.deviceSerialNumber, "sn");
    return this.deviceSerialNumber;
  }

  async startTransfer() {
    if (!this.pupService && !this.silabsService)
      throw { code: "not_implemented" };

    if (this.isPup) {
      const char = await this.pupService.getCharacteristic(PUP_DEVICE_INFO);
      const value = Buffer.from((await char.readValue()).buffer);

      this.pupChunkSize = value.readUInt8(1) - 5;
      this.pupWriteTimeout = value.readUInt16LE(12) * 10;
      this.pupVerifyTimeout = value.readUInt16LE(14) * 10;

      this.otaBlockSize = this.pupChunkSize;

      console.log(
        `DEBUG: OTA: chunk ${this.pupChunkSize}, write ${this.pupWriteTimeout}, verify ${this.pupVerifyTimeout}`
      );

      const notificationChar = await this.pupService.getCharacteristic(
        PUP_GENERAL_COMMAND_CHAR
      );
      notificationChar.addEventListener(
        "characteristicvaluechanged",
        (event) => {
          const {
            value: { buffer },
          }: { value: DataView } = event.target as any;
          console.log("DEBUG: Data from pup general command", buffer);
          this.pupWriteNotifications.emit("data", buffer);
        }
      );

      await notificationChar.startNotifications();
    } else {
      const char = await this.silabsService.getCharacteristic(SILLABS_CONTROL);

      const buf = Buffer.alloc(1);
      buf.writeUInt8(0);

      await char.writeValue(buf);
    }
  }

  async writeFirmware(data: Buffer) {
    if (!isOtaValid(data)) throw new Error("invalid firmware");
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(resolve, (this.otaBlockSize * 1000) / this.maxBytesPerSecond);
    });

    const service = this.isPup ? this.pupService : this.silabsService;
    const char = await service.getCharacteristic(
      this.isPup ? PUP_COMMAND_RESPONSE_CHAR : SILLABS_DATA_CHAR
    );

    let offset = 0;

    while (offset < data.byteLength) {
      const chunkEnd = Math.min(offset + this.otaBlockSize, data.byteLength);
      const chunk = data.subarray(offset, chunkEnd);

      try {
        await Promise.all([
          (async () => {
            if (this.isPup) {
              const header = Buffer.alloc(5);
              header.writeUInt8(0, 0);
              header.writeUInt32LE(offset, 1);
              const payload = Buffer.concat([header, chunk]);

              await char[
                this.isPup ? "writeValue" : "writeValueWithoutResponse"
              ](payload);
            } else {
              await char[
                this.isPup ? "writeValue" : "writeValueWithoutResponse"
              ](chunk);
            }

            await new Promise((resolve) => setTimeout(() => resolve(1), 10));
            if (this.isPup) {
              const response = await char.readValue();

              if (response) {
                const responseBuffer = Buffer.from(response.buffer);
                if (
                  responseBuffer.readUInt8(0) === 0 &&
                  responseBuffer.readUInt32LE(1) === offset &&
                  responseBuffer.readUInt8(5) === 0
                ) {
                  console.log(`pup: write OK ${offset}`);
                } else {
                  throw new Error("bad response");
                }
              } else {
                throw new Error("no response value");
              }
            } else {
              console.log(`sil: write OK ${offset}`);
            }
          })(),
          timeoutPromise,
        ]);
      } catch (error) {
        console.error(error);
        throw error;
      }

      const progress = ((chunkEnd / data.byteLength) * 0.7 + 0.2).toFixed(2);
      store.dispatch(setProgress(Number(progress)));

      offset += this.otaBlockSize;
    }
  }

  async verifyTransfer() {
    if (!this.pupService && !this.silabsService)
      throw { code: "not_implemented" };

    const char = await this.pupService.getCharacteristic(
      PUP_GENERAL_COMMAND_CHAR
    );

    return new Promise<void>((resolve, reject) => {
      const handler = (data: Buffer) => {
        if (
          data instanceof Buffer &&
          data.readUInt8(0) === 1 &&
          data.readUInt8(1) === 0
        ) {
          console.log("verify OK");
          resolve();
        } else {
          reject(new Error("verify failed"));
        }
      };

      this.pupWriteNotifications.on("data", handler);
    }).then(() =>
      Promise.race([
        Promise.all([
          async () => {
            const buffer = Buffer.alloc(1);
            buffer.writeUInt8(1, 0);
            await char.writeValue(buffer);
          },
          Promise.resolve(),
        ]),
        new Promise<void>((resolve, reject) => {
          setTimeout(() => {
            reject(new Error("Verify timeout"));
          }, this.pupVerifyTimeout);
        }),
      ])
    );
  }

  async endTransfer() {
    if (!this.pupService && !this.silabsService)
      throw { code: "not_implemented" };

    const socService = this.pupService || this.silabsService;

    const socControl = await socService.getCharacteristic(
      this.isPup ? PUP_COMMAND_RESPONSE_CHAR : SILLABS_CONTROL
    );

    const buf = Buffer.alloc(1);
    buf.writeUInt8(this.isPup ? 2 : 3, 0);

    await socControl[this.isPup ? "writeValue" : "writeValueWithoutResponse"](
      buf
    );
  }

  async readDeviceAuditLog(index: number): Promise<Buffer> {
    try {
      if (
        !this.service ||
        !this.server ||
        !this.server.connected ||
        !this.isLorax
      )
        return;

      const buf = Buffer.alloc(4);
      buf.writeUInt32LE(index);
      try {
        await this.sendLoraxValueShort(
          LoraxCharacteristicPathMap.AUDIT_SELECTOR,
          buf
        );
      } catch (error) {
        await new Promise((resolve) =>
          setTimeout(
            () =>
              resolve(
                this.sendLoraxValueShort(
                  LoraxCharacteristicPathMap.AUDIT_SELECTOR,
                  buf
                )
              ),
            10
          )
        );
      }

      let currentIndex: number;
      do {
        await new Promise((resolve) => setTimeout(() => resolve(1), 10));
        const auditCall = await this.getValue(
          Characteristic.AUDIT_POINTER,
          true
        );
        currentIndex = auditCall.readUInt32LE(0);
      } while (currentIndex !== index);

      const entryCall = await this.getValue(Characteristic.AUDIT_ENTRY, true);
      return entryCall;
    } catch (error) {
      return new Promise((resolve) =>
        setTimeout(() => resolve(this.readDeviceAuditLog(index)), 5)
      );
    }
  }

  async readDeviceAuditLogs({
    limit,
    reverse,
  }: {
    limit?: number;
    reverse?: boolean;
  }) {
    if (!this.service || !this.server || !this.server.connected) return;

    const initDeviceUTCTime = await this.getValue(
      Characteristic.UTC_TIME,
      true
    );

    this.utcTime = initDeviceUTCTime.readUInt32LE(0);

    const auditBegin =
      (await this.getValue(Characteristic.AUDIT_BEGIN)).readUInt32LE() + 1;
    const auditEnd =
      (await this.getValue(Characteristic.AUDIT_END)).readUInt32LE() - 1;

    let currentIndex = 0;

    const currentOffset = reverse
      ? this.auditOffset &&
        this.auditOffset <= auditBegin &&
        this.auditOffset >= auditEnd
        ? this.auditOffset
        : auditEnd
      : this.auditOffset &&
        this.auditOffset > auditBegin &&
        this.auditOffset <= auditEnd
      ? this.auditOffset
      : auditBegin;

    while (
      currentIndex < (limit ?? (reverse ? auditEnd - auditBegin : auditBegin))
    ) {
      const log = await this.readDeviceAuditLog(
        reverse ? currentOffset - currentIndex : currentOffset + currentIndex
      );

      const timestamp = new Date(log.readUInt32LE(0) * 1000);
      const logType = log[4];

      const curr = reverse
        ? currentOffset - currentIndex
        : currentOffset + currentIndex;
      this.auditLogEntries.set(curr, {
        id: curr,
        type: log[4],
        timestamp,
        data: log,
      });

      switch (logType) {
        case AuditLogCode.HEAT_CYCLE_COMPLETE: {
          if (
            timestamp.getTime() < new Date(this.utcTime * 1000).getTime() &&
            this.lastHeatCycleCompleted
          )
            break;

          const timeElapsed =
            log.readInt16LE(HeatCycleOffset.TIME_ELAPSED) / 100;
          const totalTime = log.readInt16LE(HeatCycleOffset.TOTAL_TIME) / 100;
          const nominalTemp =
            log.readInt16LE(HeatCycleOffset.HEAT_CYCLE_NOMINAL_TEMP) / 10;
          const actualTemp =
            log.readInt16LE(HeatCycleOffset.PRESENT_ACTUAL_TEMP) / 10;

          this.lastHeatCycleCompleted = {
            timestamp: timestamp.getTime(),
            timeElapsed,
            totalTime,
            actualTemp,
            nominalTemp,
          };
          this.poller.emit("data", {
            lastDab: this.lastHeatCycleCompleted,
          });
          this.emit("device_last_heat_completed", timestamp);

          break;
        }
        case AuditLogCode.CHARGE_COMPLETE: {
          if (
            timestamp.getTime() < new Date(this.utcTime * 1000).getTime() &&
            this.lastChargeCompleted
          )
            break;

          this.lastChargeCompleted = timestamp;
          this.emit("device_last_charge_completed", timestamp);

          break;
        }
      }

      currentIndex++;

      if (currentIndex >= limit) return;

      await new Promise((resolve) => setTimeout(() => resolve(1), 10));
    }
  }

  disconnect() {
    // const pollers = ["led", "chamberTemp", "batteryProfile", "totalDabs"];

    this.removeAllListeners("reconnecting");
    this.removeAllListeners("reconnected");
    this.removeAllListeners("profiles");
    this.removeAllListeners("device_connected");
    this.removeAllListeners("gatt_connected");
    this.removeAllListeners("device_last_heat_completed");
    this.removeAllListeners("device_last_charge_completed");

    this.disconnected = true;
    this.allowReconnection = false;
    this.poller?.emit("stop");
    // for (const name of pollers) {
    //   const poller = this.pollerMap.get(name);
    //   if (poller) {
    //     this.pollerMap.delete(name);
    //   }
    // }

    this.lastLoraxSequenceId = 0;
    this.loraxLimits = { maxCommands: 0, maxFiles: 0, maxPayload: 0 };
    this.auditLogEntries = new Map();
    this.loraxMessages = new Map();
    this.pollerMap = new Map();
    this.watchMap = new Map();
    this.pathWatchers = new Map();
    this.sendingCommand = false;
    this.reconnectionAttempts = 0;

    this.device?.removeEventListener(
      "gattserverdisconnected",
      this.registeredDisconnectHandler
    );

    this.server?.disconnect();
    delete this.server;
    delete this.service;
    delete this.pupService;
    delete this.device;
    delete this.registeredDisconnectHandler;

    delete this.deviceInfo;
    delete this.initState;

    delete this.loraxReply;
    delete this.loraxEvent;

    delete this.deviceFirmware;
    delete this.deviceName;
    delete this.deviceMacAddress;
    delete this.deviceSerialNumber;
    delete this.deviceModel;

    delete this.currentProfileId;
    delete this.chamberType;
    delete this.gitHash;
    delete this.utcTime;
    delete this.isPup;
    delete this.isLorax;
    delete this.hardwareVersion;
    delete this.profiles;

    delete this.lastOperatingStateUpdate;

    if (this.watcherSuspendTimeout) clearTimeout(this.watcherSuspendTimeout);

    if (this.resetReconnectionsTimer)
      clearTimeout(this.resetReconnectionsTimer);

    delete this.watcherSuspendTimeout;
    delete this.resetReconnectionsTimer;
    delete this.lastChargeCompleted;
    delete this.lastHeatCycleCompleted;
  }
}
