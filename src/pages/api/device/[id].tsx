import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { getLeaderboardDevice } from "../../../utils/hash";
import { Counter } from "../../../components/icons/Counter";
import { ProductModelMap } from "@puff-social/commons/dist/puffco/constants";
import { formatRelativeTime } from "../../../utils/time";

export const config = {
  runtime: "edge",
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

  try {
    const {
      data: { device, position },
    } = await getLeaderboardDevice(req.nextUrl.searchParams.get("id"));

    return new ImageResponse(
      (
        <div
          style={{
            backgroundColor: "#fff",
            height: "100%",
            width: "100%",
            justifyContent: "space-between",
            flexDirection: "column",
            display: "flex",
            padding: "10px",
          }}
        >
          <img
            style={{ marginLeft: "20px", marginTop: "20px" }}
            src={`https://puff.social/${ProductModelMap[
              device.model
            ].toLowerCase()}/device.png`}
            width={200}
          />
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: "1",
              right: "1",
              width: "100%",
            }}
          >
            <p
              style={{
                fontSize: 25,
                opacity: 0.6,
                fontFamily: "RobotoMono",
                display: "flex",
                justifyContent: "flex-end",
                margin: "0px",
              }}
            >
              #{position}
            </p>
          </div>
          <div
            style={{
              fontSize: 30,
              marginTop: 20,
              color: "#000000",
              display: "flex",
              flexDirection: "column",
              fontFamily: "RobotoMono Light",
            }}
          >
            <span
              style={{
                fontFamily: "RobotoMono",
              }}
            >
              {device.name}
            </span>

            <span
              style={{
                display: "flex",
                alignItems: "center",
                fontFamily: "RobotoMono",
                fontSize: "18px",
              }}
            >
              <Counter style={{ marginRight: "8px" }} />{" "}
              {device.dabs.toLocaleString()} dabs - {device.avg_dabs} avg
            </span>
            <span
              style={{
                fontFamily: "RobotoMono",
                fontSize: "16px",
              }}
            >
              🎂 {new Date(device.dob).toLocaleDateString()} - ⏰{" "}
              {formatRelativeTime(
                new Date(),
                device.last_dab && new Date(device.last_dab)
              )}
            </span>
          </div>
        </div>
      ),
      {
        width: 500,
        height: 500,
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
  } catch (error) {
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
          <div
            style={{
              fontSize: 60,
              lineHeight: 1.8,
              fontWeight: "bold",
              fontFamily: "RobotoMono Bold",
              color: "#ff2f2f",
            }}
          >
            N/A
          </div>
        </div>
      ),
      {
        width: 500,
        height: 500,
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
  }
}
