export const SILLABS_OTA_SERVICE = "1d14d6ee-fd63-4fa1-bfa4-8f47b42119f0";
export const LORAX_SERVICE = "e276967f-ea8a-478a-a92e-d78f5dd15dd5";
export const PUP_SERVICE = "420b9b40-457d-4abe-a3bf-71609d79581b";
export const SERVICE = "06caf9c0-74d3-454f-9be9-e30cd999c17a";

export const HANDSHAKE_KEY = Buffer.from("FUrZc0WilhUBteT2JlCc+A==", "base64");
export const LORAX_HANDSHAKE_KEY = Buffer.from(
  "ZMZFYlbyb1scoSc3pd1x+w==",
  "base64"
);

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

export const BASE_CHARACTERISTIC = `f9a98c15-c651-4f34-b656-d100bf5800`;
export const Characteristic = {
  ACCESS_KEY: `${BASE_CHARACTERISTIC}e0`,
  BT_MAC: `${BASE_CHARACTERISTIC}01`,
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
  [Characteristic.BT_MAC]: "/p/sys/bt/mac",
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
  OFF: {
    LORAX: new Uint8Array([0]),
    OLD: new Uint8Array([0, 0, 0, 0]),
  },
  IDLE: {
    LORAX: new Uint8Array([1]),
    OLD: new Uint8Array([0, 0, 0, 64]),
  },
  TEMP_SELECT_STOP: {
    LORAX: new Uint8Array([2]),
    OLD: new Uint8Array([0, 0, 296, 64]),
  },
  TEMP_SELECT_BEGIN: {
    LORAX: new Uint8Array([3]),
    OLD: new Uint8Array([0, 0, 64, 64]),
  },
  SWITCH_PROFILE: {
    LORAX: new Uint8Array([4]),
    OLD: new Uint8Array([0, 0, 0, 64]), // IDLE (UNKNOWN)
  },
  BATTERY_CHECK: {
    LORAX: new Uint8Array([5]),
    OLD: new Uint8Array([0, 0, 0, 64]), // IDLE (UNKNOWN)
  },
  VERSION_CHECK: {
    LORAX: new Uint8Array([6]),
    OLD: new Uint8Array([0, 0, 192, 64]),
  },
  HEAT_CYCLE_BEGIN: {
    LORAX: new Uint8Array([7]),
    OLD: new Uint8Array([0, 0, 224, 64]),
  },
  LOCK_OUT: {
    LORAX: new Uint8Array([10]), // TBH IDK WHAT THIS DOES, BUT IT PREVENTS BUTTONS PRESSEES TILL 1 IS SENT
    OLD: new Uint8Array([0, 0, 224, 64]),
  },
  BONDING: {
    LORAX: new Uint8Array([11]),
    OLD: new Uint8Array([0, 0, 48, 65]),
  },
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
  LANTERN_ON: {
    OLD: new Uint8Array([1, 0, 0, 0]),
    LORAX: new Uint8Array([1]),
  },
  LANTERN_OFF: {
    OLD: new Uint8Array([0, 0, 0, 0]),
    LORAX: new Uint8Array([0]),
  },
  LIGHT_DEFAULT: {
    OLD: new Uint8Array([255, 255, 255, 0, ColorMode.Static]),
    LORAX: new Uint8Array([255, 255, 255, 0, ColorMode.Static]),
  },
  LIGHT_NEUTRAL: {
    OLD: new Uint8Array([255, 50, 0, ColorMode.Static]),
    LORAX: new Uint8Array([255, 50, 0, ColorMode.Static]),
  },
  LIGHT_QUERY_READY: {
    OLD: new Uint8Array([0, 255, 50, 0, ColorMode.LogoBaseCircleFast]),
    LORAX: new Uint8Array([0, 255, 50, 0, ColorMode.LogoBaseCircleFast]),
  },
  LIGHT_MARKED_READY: {
    OLD: new Uint8Array([255, 50, ColorMode.Logo, 1]),
    LORAX: new Uint8Array([255, 50, ColorMode.Logo, 1]),
  },
};

export enum PuffLightMode {
  QueryReady,
  MarkedReady,
  Default,
}