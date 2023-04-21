import EventEmitter from "events";
import { LoraxCommands, loraxLimits, sendLoraxCommand } from "./puffco";

export function millisToMinutesAndSeconds(millis: number) {
  var minutes = Math.floor(millis / 60000);
  var seconds = Number(((millis % 60000) / 1000).toFixed(0));
  return seconds == 60
    ? minutes + 1 + ":00"
    : minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
}

export function convertFromHex(hex: string) {
  hex = hex.toString();
  let str = "";
  for (let i = 0; i < hex.length; i += 2)
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  return str;
}

export function convertHexStringToNumArray(h: string) {
  let i: any,
    j = (i = h.match(/.{2}/g)) != null ? i : [];
  return j == null
    ? void 0x0
    : j.map((k: string) => {
        return parseInt(k, 0x10);
      });
}

export function decimalToHexString(number: number) {
  if (number < 0) number = 0xffffffff + number + 1;

  const hex = number.toString(16).toUpperCase();
  return hex.length == 1 ? `0${hex}` : hex;
}

export function flipHexString(hexValue: string, hexDigits: number) {
  let h = hexValue.substr(0, 2);
  for (let i = 0; i < hexDigits; ++i)
    h += hexValue.substr(2 + (hexDigits - 1 - i) * 2, 2);
  return h;
}

export function hexToFloat(hex: string) {
  const int = parseInt(hex);
  let s = int >> 31 ? -1 : 1;
  let e = (int >> 23) & 255;
  return (
    ((s * ((int & 8388607) | 8388608) * 1.0) / Math.pow(2, 23)) *
    Math.pow(2, e - 127)
  );
}

export function constructLoraxCommand(
  op: number,
  seq: number,
  data?: Uint8Array
) {
  const alloc = Buffer.alloc(3);
  alloc.writeUInt16LE(seq, 0);
  alloc.writeUInt8(op, 2);

  if (data) return Buffer.concat([alloc, Buffer.from(data)]);
  return alloc;
}

export function processLoraxReply(message: ArrayBuffer) {
  const buffer = Buffer.from(message);
  const seq = buffer.readUInt16LE(0); // ? seq
  const error = buffer.readUInt8(2); // ? error
  const data = buffer.subarray(3);

  return { seq, error, data };
}

export async function getValue(
  service: BluetoothRemoteGATTService,
  characteristic: string,
  bytes = 4
): Promise<[string, DataView]> {
  const char = await service.getCharacteristic(characteristic);
  const value = await char.readValue();

  if (bytes == 0) return [null, value];

  let str = "";
  for (let i = 0; i < bytes; i++)
    str += decimalToHexString(value.getUint8(i)).toString();
  const hex = flipHexString("0x" + str, 8);
  return [hex, value];
}

function readCmd(t: number, path: string) {
  const w = Buffer.alloc(6);
  w.writeUInt16LE(t, 0);
  w.writeUInt16LE(loraxLimits.maxPayload, 2);

  const buff = Buffer.concat([w, Buffer.from(path)]);
  return buff;
}

function readShortCmd(p: number, path: string) {
  const w = Buffer.alloc(4);
  w.writeUInt16LE(p, 0);
  w.writeUInt16LE(loraxLimits.maxPayload, 2);
  const t = Buffer.concat([w, Buffer.from(path)]);
  return t;
}

function writeShortCmd(p: number, path: string, data: Buffer) {
  const w = Buffer.alloc(3);
  w.writeUInt16LE(p, 0);
  // w.writeUInt16LE(loraxLimits.maxPayload, 2);
  const t = Buffer.concat([w, Buffer.from(path), Buffer.from([0]), data]);
  return t;
}

function openCmd(r: number, path: string) {
  const w = Buffer.alloc(1);
  w.writeUInt8(r, 0);

  const u = Buffer.concat([w, Buffer.from(path)]);
  return u;
}

export async function getLoraxValue(path: string) {
  const command = readCmd(0, path);
  await sendLoraxCommand(LoraxCommands.READ, command, path);
}

export async function getLoraxValueShort(path: string) {
  const command = readShortCmd(0, path);
  await sendLoraxCommand(LoraxCommands.READ_SHORT, command, path);
}

export async function sendLoraxValueShort(path: string, data: Buffer) {
  const command = writeShortCmd(0, path, data);
  await sendLoraxCommand(LoraxCommands.WRITE_SHORT, command, path);
}

export function intArrayToMacAddress(uint8Array: Uint8Array): string {
  const hexString = Array.from(uint8Array)
    .reverse()
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join(":");

  return hexString.toUpperCase();
}

export async function gattPoller(
  service: BluetoothRemoteGATTService,
  characteristic: string,
  bytes = 4,
  time?: number
): Promise<EventEmitter> {
  if (!time) time = 10000; // 10s
  // time = time + Math.floor(Math.random() * 2000) + 100 // Make this jitter higher on android only
  const listener = new EventEmitter();
  const char = await service.getCharacteristic(characteristic);

  const func = async () => {
    const value = await char.readValue();
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
  const int = setInterval(func, time);

  listener.on("stop", () => {
    listener.removeAllListeners();
    clearInterval(int);
  });

  return listener;
}
