import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

import { APIGroup } from "../../../types/api";

export const config = {
  runtime: "experimental-edge",
};

const font = fetch(
  new URL("../../../../public/font/SpaceMono-Regular.ttf", import.meta.url)
).then((res) => res.arrayBuffer());
const fontBold = fetch(
  new URL("../../../../public/font/SpaceMono-Bold.ttf", import.meta.url)
).then((res) => res.arrayBuffer());

export default async function handler(req: NextRequest) {
  const fontData = await font;
  const fontBoldData = await fontBold;

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
              fontFamily: "SpaceMono-Bold",
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
            name: "SpaceMono-Bold",
            data: fontBoldData,
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
              fontFamily: "SpaceMono",
            }}
          >
            <span
              style={{
                fontFamily: "SpaceMono-Bold",
              }}
            >
              {data.name}
            </span>
            <span>
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
            name: "SpaceMono",
            data: fontData,
            style: "normal",
          },
          {
            name: "SpaceMono-Bold",
            data: fontBoldData,
            style: "normal",
          },
        ],
      }
    );
  }
}
