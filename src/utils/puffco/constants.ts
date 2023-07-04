export const SERVICE = "06caf9c0-74d3-454f-9be9-e30cd999c17a";
export const LORAX_SERVICE = "e276967f-ea8a-478a-a92e-d78f5dd15dd5";

export const SILLABS_OTA_SERVICE = "1d14d6ee-fd63-4fa1-bfa4-8f47b42119f0";
export const SILLABS_OTA_VERSION = "4cc07bcf-0868-4b32-9dad-ba4cc41e5316";
export const SILLABS_VERISON = "0d77cc11-4ac1-49f2-bfa9-cd96ac7a92f8";
export const SILLABS_CONTROL = "f7bf3564-fb6d-4e53-88a4-5e37e0326063";
export const SILLABS_DATA_CHAR = "984227f3-34fc-4045-a5d0-2c581f81a153";

export const PUP_SERVICE = "420b9b40-457d-4abe-a3bf-71609d79581b";
export const PUP_APP_VERSION = "58b0a7aa-d89f-4bf2-961d-0d892d7439d8";
export const PUP_DEVICE_INFO = "2dab0217-8a4e-4de8-83c7-8fded59f4599";
export const PUP_TRIGGER_CHAR = "c830ee3e-0e32-4780-a51d-b1b0b38089a4";
export const PUP_SERIAL_NUMBER_CHAR = "a5fa5a5d-f28e-47d9-b95b-f82c06177503";
export const PUP_GENERAL_COMMAND_CHAR = "c364cf1d-117f-4a3b-baae-3e2fce5a248f";
export const PUP_COMMAND_RESPONSE_CHAR = "baeb965b-58ac-43bf-9cc5-bfb448ec2e72";

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
  HEATER_TEMP_COMMAND: `${BASE_CHARACTERISTIC}26`,
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
  BATTERY_CHARGE_ELAPSED_TIME: `${BASE_CHARACTERISTIC}32`,
  BATTERY_CHARGE_EST_TIME_TO_FULL: `${BASE_CHARACTERISTIC}33`,
  BATTERY_TEMP: `${BASE_CHARACTERISTIC}34`,
  UPTIME: `${BASE_CHARACTERISTIC}35`,
  MAGNETIC: `${BASE_CHARACTERISTIC}36`,
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
  PROFILE_PREHEAT_COLOR: `${BASE_CHARACTERISTIC}6a`,
  PROFILE_ACTIVE_COLOR: `${BASE_CHARACTERISTIC}6b`,
  PROFILE: `${BASE_CHARACTERISTIC}61`,
  PROFILE_NAME: `${BASE_CHARACTERISTIC}62`,
  PROFILE_PREHEAT_TEMP: `${BASE_CHARACTERISTIC}63`,
  PROFILE_PREHEAT_TIME: `${BASE_CHARACTERISTIC}64`,
  PROFILE_COLOR: `${BASE_CHARACTERISTIC}65`,
  PROFILE_BOOST_TEMP: `${BASE_CHARACTERISTIC}67`,
  PROFILE_BOOST_TIME: `${BASE_CHARACTERISTIC}68`,
  PROFILE_THRESHOLD_TEMP: `${BASE_CHARACTERISTIC}69`,
  LED_BRIGHTNESS: `${BASE_CHARACTERISTIC}4b`,
  DEVICE_NAME: `${BASE_CHARACTERISTIC}4d`,
  DEVICE_BIRTHDAY: `${BASE_CHARACTERISTIC}4e`,
  TRIP_HEAT_CYCLES: `${BASE_CHARACTERISTIC}51`,
  TRIP_HEAT_CYCLE_TIME: `${BASE_CHARACTERISTIC}52`,
  HEAT_CYCLE_COUNT: `${BASE_CHARACTERISTIC}60`,

  P_COEFF: `${BASE_CHARACTERISTIC}e1`,
  I_COEFF: `${BASE_CHARACTERISTIC}e2`,
  D_COEFF: `${BASE_CHARACTERISTIC}e3`,

  MODEL_SERVICE: "0000180a-0000-1000-8000-00805f9b34fb",
  HARDWARE_MODEL: "00002a24-0000-1000-8000-00805f9b34fb",
  FIRMWARE_VERSION: "00002a28-0000-1000-8000-00805f9b34fb",
  HARDWARE_VERSION: "00002a27-0000-1000-8000-00805f9b34fb",
  SERIAL_NUMBER: "00002a25-0000-1000-8000-00805f9b34fb",

  AUDIT_POINTER: `${BASE_CHARACTERISTIC}c1`,
  AUDIT_ENTRY: `${BASE_CHARACTERISTIC}c2`,
  AUDIT_BEGIN: `${BASE_CHARACTERISTIC}c3`,
  AUDIT_END: `${BASE_CHARACTERISTIC}c4`,

  FAULT_POINTER: `${BASE_CHARACTERISTIC}d1`,
  FAULT_ENTRY: `${BASE_CHARACTERISTIC}d2`,
  FAULT_BEGIN: `${BASE_CHARACTERISTIC}d3`,
  FAULT_END: `${BASE_CHARACTERISTIC}d4`,
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
  [Characteristic.HEATER_TEMP_COMMAND]: "/p/app/htr/tcmd",
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
  [Characteristic.BATTERY_CHARGE_ELAPSED_TIME]: "/p/bat/chg/elap",
  [Characteristic.BATTERY_CHARGE_EST_TIME_TO_FULL]: "/p/bat/chg/etf",
  [Characteristic.BATTERY_TEMP]: "/p/bat/temp",
  [Characteristic.UPTIME]: "/p/sys/uptm",
  [Characteristic.MAGNETIC]: "/p/magm/bfld",
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
  [Characteristic.HARDWARE_VERSION]: "/p/sys/hw/ver",
  [Characteristic.FIRMWARE_VERSION]: "/p/sys/fw/ver",
  [Characteristic.P_COEFF]: "/p/htr/tun/pco",
  [Characteristic.I_COEFF]: "/p/htr/tun/ico",
  [Characteristic.D_COEFF]: "/p/htr/tun/dco",

  AUDIT_SELECTOR: "/p/logv/aud/sel", // Int32
  [Characteristic.AUDIT_POINTER]: "/p/logv/aud/curr", // Int32
  [Characteristic.AUDIT_ENTRY]: "/p/logv/aud/entr", // Buffer
  [Characteristic.AUDIT_BEGIN]: "/p/logv/aud/begn", // Int32
  [Characteristic.AUDIT_END]: "/p/logv/aud/end", // Int32

  [Characteristic.FAULT_POINTER]: "/p/logv/flt/curr", // Int32
  [Characteristic.FAULT_ENTRY]: "/p/logv/flt/entr", // Buffer
  [Characteristic.FAULT_BEGIN]: "/p/logv/flt/begn", // Int32
  [Characteristic.FAULT_END]: "/p/logv/flt/end", // Int32
};

export const intMap = {
  [LoraxCharacteristicPathMap[Characteristic.OPERATING_STATE]]: 400,
  [LoraxCharacteristicPathMap[Characteristic.CHAMBER_TYPE]]: 600,
  [LoraxCharacteristicPathMap[Characteristic.HEATER_TEMP]]: 500,
  [LoraxCharacteristicPathMap[Characteristic.STATE_ELAPSED_TIME]]: 1000,
  [LoraxCharacteristicPathMap[Characteristic.UTC_TIME]]: 1000,
};

export const DynamicLoraxCharacteristics = {
  [Characteristic.PROFILE_NAME]: (id: number) => `/u/app/hc/${id}/name`,
  [Characteristic.PROFILE_COLOR]: (id: number) => `/u/app/hc/${id}/colr`,
  [Characteristic.PROFILE_PREHEAT_TEMP]: (id: number) => `/u/app/hc/${id}/temp`,
  [Characteristic.PROFILE_PREHEAT_TIME]: (id: number) => `/u/app/hc/${id}/time`,
  [Characteristic.PROFILE_ACTIVE_COLOR]: (id: number) => `/u/app/hc/${id}/accl`,
  [Characteristic.PROFILE_PREHEAT_COLOR]: (id: number) =>
    `/u/app/hc/${id}/phcl`,
  [Characteristic.PROFILE_BOOST_TEMP]: (id: number) => `/u/app/hc/${id}/btmp`,
  [Characteristic.PROFILE_BOOST_TIME]: (id: number) => `/u/app/hc/${id}/btim`,
  [Characteristic.PROFILE_THRESHOLD_TEMP]: (id: number) =>
    `/u/app/hc/${id}/thrt`,
  PROFILE_INTENSITY: (id: number) => `/u/app/hc/${id}/intn`,
  PROFILE_SCRATCH_PAD: (id: number) => `/u/app/hc/${id}/scpd`,
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
  HEAT_CYCLE_STOP: {
    LORAX: new Uint8Array([8]),
    OLD: new Uint8Array([0, 0, 0, 65]),
  },
  HEAT_CYCLE_BOOST: {
    LORAX: new Uint8Array([9]),
    OLD: new Uint8Array([0, 0, 16, 65]),
  },
  FACTORY_TEST: {
    LORAX: new Uint8Array([10]),
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

export const ChamberTypeMap = {
  0: "None",
  1: "Normal",
  3: "3D",
};

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

export const MiddlewareValue = {
  STRING: "string",
  FLOAT: "float",
  U_INT_8: "uInt8",
  U_INT_16: "uInt16",
  U_INT_32: "uInt32",
  INT_8: "int8",
  INT_32: "int32",
  BUFFER: "buffer",
  ULID: "ulid",
  COLORS: "colors",
};

export const scratchpadIdField = {
  key: "scratchpadId",
  type: MiddlewareValue.U_INT_8,
};

export const moodUlidField = {
  key: "moodUlid",
  type: MiddlewareValue.ULID,
};

export const moodFields = [moodUlidField];

export const moodNameField = {
  key: "moodName",
  type: MiddlewareValue.STRING,
  length: 32,
};

export const moodDateModifiedField = {
  key: "moodDateModified",
  type: MiddlewareValue.U_INT_32,
};

export const moodTypeField = {
  key: "moodType",
  type: MiddlewareValue.U_INT_8,
};

export const tempoField = {
  key: "tempo",
  type: MiddlewareValue.FLOAT,
};

export const colorsField = {
  key: "colors",
  type: MiddlewareValue.COLORS,
  length: 18,
};

export const moodFieldsExtended = moodFields.concat(
  moodNameField,
  moodDateModifiedField,
  moodTypeField,
  tempoField,
  colorsField
);

export const originalMoodUlidField = {
  key: "originalMoodUlid",
  type: MiddlewareValue.ULID,
};

export const moodFieldsExtendedWithOriginal = moodFieldsExtended.concat(
  originalMoodUlidField
);

export const heatProfileUlidField = {
  key: "heatProfileUlid",
  type: MiddlewareValue.ULID,
};

export const heatProfileDateModifiedField = {
  key: "heatProfileDateModified",
  type: MiddlewareValue.U_INT_32,
};

export const heatProfileFields = [
  heatProfileUlidField,
  heatProfileDateModifiedField,
];
export const moodAndHeatProfileFields = heatProfileFields.concat(moodFields);
export const moodAndHeatProfileFieldsExtended =
  heatProfileFields.concat(moodFieldsExtended);
export const moodAndHeatProfileFieldsExtendedWithOriginal =
  heatProfileFields.concat(moodFieldsExtendedWithOriginal);

if (typeof window != "undefined") {
  window["DeviceCommand"] = DeviceCommand;
  window["Characteristic"] = Characteristic;
  window["LoraxCommands"] = LoraxCommands;
  window["LoraxCharacteristic"] = LoraxCharacteristic;
  window["LoraxCharacteristicPathMap"] = LoraxCharacteristicPathMap;
  window["DynamicLoraxCharacteristics"] = DynamicLoraxCharacteristics;
}
