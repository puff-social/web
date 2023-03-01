import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

import { APIGroup } from "../../../types/api";

export const config = {
  runtime: "experimental-edge",
};

const font = fetch(
  new URL("../../../../public/font/RobotoMono-Regular.ttf", import.meta.url)
).then((res) => res.arrayBuffer());
const fontLight = fetch(
  new URL("../../../../public/font/RobotoMono-Light.ttf", import.meta.url)
).then((res) => res.arrayBuffer());
const fontBold = fetch(
  new URL("../../../../public/font/RobotoMono-Bold.ttf", import.meta.url)
).then((res) => res.arrayBuffer());

export default async function handler(req: NextRequest) {
  const fontData = await font;
  const lightFontData = await fontLight;
  const boldFontData = await fontBold;

  const group = await fetch(
    `https://rosin.puff.social/v1/groups/${req.nextUrl.searchParams.get("id")}`
  );

  if (group.status != 200)
    return new ImageResponse(
      (
        <div
          style={{
            backgroundColor: "#fff",
            height: "100%",
            width: "100%",
            textAlign: "center",
            alignContent: "center",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            display: "flex",
          }}
        >
          <img src="https://puff.social/pixel-peak.png" />
          <div
            style={{
              fontSize: 60,
              marginTop: 30,
              lineHeight: 1.8,
              fontWeight: "bold",
              fontFamily: "RobotoMono Bold",
              color: "#ff2f2f",
            }}
          >
            Group not found...
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: "RobotoMono",
            data: fontData,
            style: "normal",
          },
          {
            name: "RobotoMono Bold",
            data: boldFontData,
            style: "normal",
          },
        ],
      }
    );
  else {
    const data = (await group.json()).data as APIGroup;
    return new ImageResponse(
      (
        <div
          style={{
            backgroundColor: "#fff",
            height: "100%",
            width: "100%",
            textAlign: "center",
            alignContent: "center",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            display: "flex",
          }}
        >
          <img src="https://puff.social/pixel-peak.png" />
          <div
            style={{
              fontSize: 60,
              marginTop: 30,
              color: "#000000",
              display: "flex",
              flexDirection: "column",
              textAlign: "center",
              justifyContent: "center",
              alignItems: "center",
              fontFamily: "RobotoMono Light",
            }}
          >
            <span
              style={{
                fontFamily: "RobotoMono",
              }}
            >
              {data.name}
            </span>
            <span
              style={{
                fontSize: 35,
              }}
            >
              {data.sesher_count} sesher
              {data.sesher_count > 1 || data.sesher_count == 0
                ? "s"
                : ""} - {data.watcher_count} watcher
              {data.watcher_count > 1 || data.watcher_count == 0 ? "s" : ""}
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: "RobotoMono",
            data: fontData,
            style: "normal",
          },
          {
            name: "RobotoMono Light",
            data: lightFontData,
            style: "normal",
          },
        ],
      }
    );
  }
}
