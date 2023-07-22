import {
  constructLoraxCommand,
  processLoraxReply,
  writeShortCmd,
  readShortCmd,
  watchCmd,
  openCmd,
  crc32,
  isOtaValid,
} from "@puff-social/commons/dist/puffco";
import { decode } from "cbor";

export function convertFromHex(hex: string) {
  hex = hex.toString();
  let str = "";
  for (let i = 0; i < hex.length; i += 2)
    str += String.fromCharCode(parseInt(hex.substring(i, 2), 16));
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
  let h = hexValue.substring(0, 2);
  for (let i = 0; i < hexDigits; ++i)
    h += hexValue.substring(2 + (hexDigits - 1 - i) * 2, 2);
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

export async function fetchFirmwareFile(url: string) {
  const req = await fetch(url);
  if (req.status != 200) throw { code: "failed" };

  const buffer = Buffer.from(await req.arrayBuffer());

  return buffer;
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
