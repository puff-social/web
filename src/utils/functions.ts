import {
  constructLoraxCommand,
  processLoraxReply,
  writeShortCmd,
  readShortCmd,
  watchCmd,
  openCmd,
  crc32,
  isOtaValid, TableColorBytes, NvmArrayIndicies, LanternScratchpadId, ProfileScratchpadId,
  LumaAnimation,LightingPattern, MoodArrayOffsets, writeInt32NumbersToBuffer, writeAnimNumArrayToBuffer
} from "@puff-social/commons/dist/puffco";
import { decode, encode } from "cbor";

export async function fetchFirmwareFile(url: string) {
  const req = await fetch(url);
  if (req.status != 200) throw { code: "failed" };

  const buffer = Buffer.from(await req.arrayBuffer());

  return buffer;
}

if (typeof window != "undefined") {
  window["writeAnimNumArrayToBuffer"] = writeAnimNumArrayToBuffer;
  window["writeInt32NumbersToBuffer"] = writeInt32NumbersToBuffer;
  window["MoodArrayOffsets"] = MoodArrayOffsets;
  window["LightingPattern"] = LightingPattern;
  window["LumaAnimation"] = LumaAnimation;
  window["ProfileScratchpadId"] = ProfileScratchpadId;
  window["LanternScratchpadId"] = LanternScratchpadId;
  window["TableColorBytes"] = TableColorBytes;
  window["NvmArrayIndicies"] = NvmArrayIndicies;
  window["Buffer"] = Buffer;
  window["decode"] = decode;
  window["encode"] = encode;
  window["constructLoraxCommand"] = constructLoraxCommand;
  window["processLoraxReply"] = processLoraxReply;
  window["writeShortCmd"] = writeShortCmd;
  window["readShortCmd"] = readShortCmd;
  window["watchCmd"] = watchCmd;
  window["openCmd"] = openCmd;
  window["fetchFirmwareFile"] = fetchFirmwareFile;
  window["crc32"] = crc32;
  window["isOtaValid"] = isOtaValid;
}
