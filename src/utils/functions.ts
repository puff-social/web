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

export async function fetchFirmwareFile(url: string) {
  const req = await fetch(url);
  if (req.status != 200) throw { code: "failed" };

  const buffer = Buffer.from(await req.arrayBuffer());

  return buffer;
}

if (typeof window != "undefined") {
  window["Buffer"] = Buffer;
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
