import { LoraxLimits } from "../types/puffco";

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

export function convertHexArrayToNumArray(hexArray: string[]): number[] {
  const numArray: number[] = [];

  for (let i = 0; i < hexArray.length; i++) {
    const hexValue: string = hexArray[i];
    const numValue: number = parseInt(hexValue, 16);
    numArray.push(numValue);
  }

  return numArray;
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

export function processLoraxReply(message: ArrayBuffer) {
  const buffer = Buffer.from(message);
  const seq = buffer.readUInt16LE(0); // ? seq
  const error = buffer.readUInt8(2); // ? error
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

  const buff = Buffer.concat([w, Buffer.from(path)]);
  return buff;
}

export function readShortCmd(loraxLimits: LoraxLimits, path: string) {
  const w = Buffer.alloc(4);
  w.writeUInt16LE(0, 0);
  w.writeUInt16LE(loraxLimits.maxPayload, 2);
  const t = Buffer.concat([w, Buffer.from(path)]);
  return t;
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

export function openCmd(r: number, path: string) {
  const w = Buffer.alloc(1);
  w.writeUInt8(r, 0);

  const u = Buffer.concat([w, Buffer.from(path)]);
  return u;
}

export function intArrayToMacAddress(uint8Array: Uint8Array): string {
  const hexString = Array.from(uint8Array)
    .reverse()
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join(":");

  return hexString.toUpperCase();
}

if (typeof window != "undefined") {
  window["Buffer"] = Buffer;
  window["hexToFloat"] = hexToFloat;
  window["decimalToHexString"] = decimalToHexString;
  window["constructLoraxCommand"] = constructLoraxCommand;
  window["writeShortCmd"] = writeShortCmd;
  window["readShortCmd"] = readShortCmd;
}
