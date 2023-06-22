import { decode } from "cbor";

import { LoraxLimits } from "../types/puffco";
import { crcPatterns } from "./constants";

export function millisToMinutesAndSeconds(millis: number) {
  let minutes = Math.floor(millis / 60000);
  let seconds = Number(((millis % 60000) / 1000).toFixed(0));
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

  if (data)
    return Buffer.concat([
      alloc,
      "byteLength" in data ? data : Buffer.from(data),
    ]);
  return alloc;
}

export function processLoraxEvent(message: ArrayBuffer) {
  const buffer = Buffer.from(message);
  const seq = buffer.readUInt16LE(0);
  const error = buffer.readUInt8(2);

  const byte = Buffer.from(buffer.subarray(3));
  const watchId = byte.readUInt16LE(0);
  const data = buffer.subarray(6);

  return { seq, error, data, watchId };
}

export function processLoraxReply(message: ArrayBuffer) {
  const buffer = Buffer.from(message);
  const seq = buffer.readUInt16LE(0);
  const error = buffer.readUInt8(2);
  const data = buffer.subarray(3);

  return { seq, error, data };
}

export function lettersToNumbers(text: string) {
  return [...text].reduce((prev, curr) => {
    return prev * 26 + curr.charCodeAt(0) - 64;
  }, 0);
}

export function numbersToLetters(value: number) {
  let letters = "";
  while (value-- > 0) {
    letters = String.fromCharCode((value % 26) + 65) + letters;
    value = Math.floor(value / 26);
  }
  return letters || "A";
}

export function readCmd(loraxLimits: LoraxLimits, t: number, path: string) {
  const w = Buffer.alloc(6);
  w.writeUInt16LE(t, 0);
  w.writeUInt16LE(loraxLimits.maxPayload, 2);
  w.writeUInt16LE(0, 4);
  return w;
}

export function readShortCmd(loraxLimits: LoraxLimits, path: string) {
  const w = Buffer.alloc(4);
  w.writeUInt16LE(0, 0);
  w.writeUInt16LE(loraxLimits.maxPayload, 2);
  const t = Buffer.concat([w, Buffer.from(path)]);
  return t;
}

export function watchCmd(openCmdId: number, int = 1000, length = 1) {
  const w = Buffer.alloc(10);
  w.writeUInt16LE(openCmdId, 0);
  w.writeUInt16LE(0, 2);
  w.writeUInt16LE(int, 4);
  w.writeUInt16LE(0, 6);
  w.writeUInt16LE(length, 8);
  return w;
}

export function unwatchCmd(openCmdId: number) {
  const w = Buffer.alloc(2);
  w.writeUInt16LE(openCmdId, 0);
  return w;
}

export function writeShortCmd(path: string, data: Buffer, padding: boolean) {
  const w = Buffer.alloc(3);
  w.writeUInt16LE(0, 0);
  w.writeUInt8(0, 2);
  const t = Buffer.concat([
    w,
    Buffer.from(path),
    padding ? Buffer.concat([Buffer.from([0]), data]) : data,
  ]);
  return t;
}

export function writeCmd(
  loraxLimits: LoraxLimits,
  q: number,
  r: any,
  path: string,
  data: Buffer
) {
  const w = Buffer.alloc(4);
  w.writeUInt16LE(q, 0);
  w.writeUInt8(loraxLimits.maxPayload, 2);
  const t = Buffer.concat([w, Buffer.from(path), Buffer.from([0]), data]);
  return t;
}

export function openCmd(r: LoraxLimits, path: string) {
  const w = Buffer.alloc(1);
  w.writeUInt8(0, 0);

  const u = Buffer.concat([w, Buffer.from(path)]);
  return u;
}

export function closeCmd(id: number) {
  const w = Buffer.alloc(2);
  w.writeUInt16LE(id, 0);
  return w;
}

export function intArrayToMacAddress(uint8Array: Uint8Array): string {
  const hexString = Array.from(uint8Array)
    .reverse()
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join(":");

  return hexString.toUpperCase();
}

export async function fetchFirmwareFile(url: string) {
  const req = await fetch(url);
  if (req.status != 200) throw { code: "failed" };

  const buffer = Buffer.from(await req.arrayBuffer());

  return buffer;
}

export function crc32(arr: Buffer) {
  let crc = 4294967295;
  arr.forEach((n) => (crc = (crc >>> 8) ^ crcPatterns[(crc ^ n) & 255]));
  return crc ^ 4294967295;
}

export function isOtaValid(firmware: Buffer) {
  const firmwareLength = firmware.length - 4;
  const firmwareData = firmware.subarray(0, firmwareLength);
  const crcData = firmware.subarray(firmwareLength);

  return crcData.readInt32LE(0) === crc32(firmwareData);
}

if (typeof window != "undefined") {
  window["Buffer"] = Buffer;
  window["hexToFloat"] = hexToFloat;
  window["decimalToHexString"] = decimalToHexString;
  window["constructLoraxCommand"] = constructLoraxCommand;
  window["processLoraxReply"] = processLoraxReply;
  window["writeShortCmd"] = writeShortCmd;
  window["readShortCmd"] = readShortCmd;
  window["watchCmd"] = watchCmd;
  window["openCmd"] = openCmd;
  window["cborDecode"] = decode;
  window["fetchFirmwareFile"] = fetchFirmwareFile;
  window["crc32"] = crc32;
  window["isOtaValid"] = isOtaValid;
}
