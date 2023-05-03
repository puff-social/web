import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { getLeaderboardDevice } from "../../../utils/hash";
import { ProductModelMap } from "../../../utils/constants";
import { Crown } from "../../../components/icons/Crown";
import { Counter } from "../../../components/icons/Counter";

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
    const device = await getLeaderboardDevice(
      req.nextUrl.searchParams.get("id")
    );

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
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <span />
            <p
              style={{
                fontSize: 25,
                opacity: 0.6,
                position: "absolute",
                right: "0",
                fontFamily: "RobotoMono",
                display: "flex",
                justifyContent: "flex-end",
                margin: "0px",
                marginTop: "0px",
                marginRight: "10px",
              }}
            >
              #{device.data.position}
            </p>
          </div>
          <img
            src={`https://puff.social/${ProductModelMap[
              device.data.device.devices.model
            ].toLowerCase()}/device.png`}
            width={200}
          />
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
              {device.data.device.devices.name}
            </span>

            <span
              style={{
                fontFamily: "RobotoMono",
              }}
            >
              <Counter style={{ marginRight: "10px" }} />{" "}
              {device.data.device.devices.dabs.toLocaleString()}
            </span>
            <span
              style={{
                fontFamily: "RobotoMono",
              }}
            >
              🎂 {new Date(device.data.device.devices.dob).toLocaleDateString()}
            </span>
          </div>
        </div>
      ),
      {
        width: 325,
        height: 600,
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
    console.log(error, "error");
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
        width: 325,
        height: 600,
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
