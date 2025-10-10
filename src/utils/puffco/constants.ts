import {
  LoraxCharacteristicPathMap,
  Characteristic,
  DeviceCommand,
  LoraxCommands,
  LoraxCharacteristic,
  DynamicLoraxCharacteristics,
  parseHeatColorBuffer,
  // buildHeatColorBuffer,
} from "@puff-social/commons/dist/puffco";

export const intMap = {
  [LoraxCharacteristicPathMap[Characteristic.OPERATING_STATE]]: 400,
  [LoraxCharacteristicPathMap[Characteristic.CHAMBER_TYPE]]: 600,
  [LoraxCharacteristicPathMap[Characteristic.HEATER_TEMP]]: 500,
  [LoraxCharacteristicPathMap[Characteristic.STATE_ELAPSED_TIME]]: 1000,
  [LoraxCharacteristicPathMap[Characteristic.UTC_TIME]]: 1000,
};

if (typeof window != "undefined") {
  window["DeviceCommand"] = DeviceCommand;
  window["Characteristic"] = Characteristic;
  window["LoraxCommands"] = LoraxCommands;
  window["LoraxCharacteristic"] = LoraxCharacteristic;
  window["LoraxCharacteristicPathMap"] = LoraxCharacteristicPathMap;
  window["DynamicLoraxCharacteristics"] = DynamicLoraxCharacteristics;
  window["parseHeatColorBuffer"] = parseHeatColorBuffer;
  // window["buildHeatColorBuffer"] = buildHeatColorBuffer;
}
