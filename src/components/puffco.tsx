import {
  ChamberType,
  ChargeSource,
  PuffcoOperatingState,
} from "@puff-social/commons/dist/puffco/constants";

import { PropsWithoutRef, useEffect, useState } from "react";
import usePrefersColorScheme from "use-prefers-color-scheme";

export interface DeviceProps {
  svgClassName?: string;
  activeColor?: { r: number; g: number; b: number };
  brightness?: number;
  battery?: number;
  temperature?: number;
  state?: PuffcoOperatingState;
  chamberType?: ChamberType;
  chargeSource?: ChargeSource;
}

export function PuffcoContainer({
  id,
  device,
  model = "peak",
  chamberType = ChamberType.Normal,
  className,
  svgClassName,
}: {
  id: string;
  device?: DeviceProps;
  model?: string;
} & PropsWithoutRef<any>) {
  const [r, setRed] = useState(0);
  const [g, setGreen] = useState(0);
  const [b, setBlue] = useState(0);

  const prefersColorScheme = usePrefersColorScheme();

  const [brightness, setBrightness] = useState(device?.brightness || 100);

  function setRgb(r: number, g: number, b: number) {
    setRed(r);
    setGreen(g);
    setBlue(b);
  }

  function animateBrightness(start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setBrightness(Math.floor(progress * (end - start) + start));
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }

  useEffect(() => {
    let interval: NodeJS.Timeout;
    switch (device?.chargeSource) {
      case ChargeSource.Wireless:
      case ChargeSource.USB: {
        setBrightness(100);
        interval = setInterval(() => {
          animateBrightness(100, 30, 5000);
          setTimeout(() => animateBrightness(30, 100, 5000), 5000);
        }, 10000);
        break;
      }
      default: {
        setBrightness(100);
        break;
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [device?.chargeSource]);

  useEffect(() => {
    setBrightness(100);
    setRgb(device?.activeColor.r, device?.activeColor.g, device?.activeColor.b);
  }, [device?.activeColor]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    switch (device?.state) {
      case PuffcoOperatingState.IDLE:
      case PuffcoOperatingState.SLEEP: {
        break;
      }
      case PuffcoOperatingState.HEAT_CYCLE_PREHEAT: {
        setBrightness(100);
        interval = setInterval(() => {
          animateBrightness(100, 20, 1500);
          setTimeout(() => animateBrightness(20, 100, 1500), 1500);
        }, 3000);
        break;
      }
      case PuffcoOperatingState.HEAT_CYCLE_ACTIVE: {
        if (interval) clearInterval(interval);
        setBrightness(100);
        break;
      }
      case PuffcoOperatingState.HEAT_CYCLE_FADE: {
        if (interval) clearInterval(interval);
        break;
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [device?.state]);

  return (
    <div
      className={`flex flex-col justify-center items-center${
        className ? ` ${className}` : ""
      }`}
    >
      <div className={`flex justify-center items-center self-center`}>
        <svg
          className={`${
            svgClassName || "w-full"
          } flex justify-center items-center self-center`}
          viewBox="0 0 5 8"
        >
          {["storm", "daybreak"].includes(model) ? (
            <>
              {model == "storm" ? (
                <image
                  className="flex justify-center items-center self-center"
                  height="100%"
                  href={`/${model}/glass.png`}
                />
              ) : (
                <></>
              )}
              <image
                className="flex justify-center items-center self-center"
                height="100%"
                href={`/${model}/base.png`}
              />
              {chamberType == ChamberType.XL ? (
                <image
                  className="flex justify-center items-center self-center"
                  height="100%"
                  href={`/${model}/chamber-xl.png`}
                />
              ) : chamberType == ChamberType.None ? (
                <></>
              ) : (
                <image
                  className="flex justify-center items-center self-center"
                  height="100%"
                  href={`/${model}/chamber-regular.png`}
                />
              )}
            </>
          ) : (
            <image
              className="flex justify-center items-center self-center"
              height="100%"
              href={`/${model}/device.png`}
            />
          )}
          <filter
            className="flex justify-center items-center self-center"
            id={`${id}-svg-matrix`}
            x="0"
            y="0"
            height="100%"
          >
            <feColorMatrix
              type="matrix"
              values={`${r / 100} 0 0 0 0
                        0 ${g / 100} 0 0 0
                        0 0 ${b / 100} 0 0
                        0 0 0 ${
                          ["onyx", "pearl", "desert", "flourish"].includes(
                            model,
                          ) ||
                          (!r && !g && !b)
                            ? 0
                            : brightness / 100
                        } 0`}
            ></feColorMatrix>
          </filter>
          {["onyx", "pearl", "desert", "flourish", "storm"].includes(model)
            ? [
                "peach/peak-peach-lights-glass-mid-left",
                "peach/peak-peach-lights-glass-mid-right",
                "peach/peak-peach-lights-glass-far-left",
                "peach/peak-peach-lights-glass-far-right",
                "peach/peak-peach-lights-base-far-left",
                "peach/peak-peach-lights-base-far-right",
                "peach/peak-peach-lights-base-mid-left",
                "peach/peak-peach-lights-base-mid-right",
                "peach/peak-peach-lights-ring-far-right",
                "peach/peak-peach-lights-ring-far-left",
                "peach/peak-peach-lights-ring-mid-left",
              ].map((img, key) => (
                <image
                  className="flex justify-center items-center self-center"
                  height="100%"
                  key={key}
                  filter={`url(#${id}-svg-matrix)`}
                  href={`/${img}.png`}
                />
              ))
            : [
                "peak/device-glass-left",
                "peak/device-glass-right",
                "peak/device-base-left",
                "peak/device-base-right",
              ].map((img, key) => (
                <image
                  className="flex justify-center items-center self-center"
                  height="100%"
                  key={key}
                  filter={`url(#${id}-svg-matrix)`}
                  href={`/${img}.png`}
                />
              ))}
          {chamberType == ChamberType.XL ? (
            ["storm", "daybreak"].includes(model) ? (
              <></>
            ) : (
              <image
                className="flex justify-center items-center self-center"
                height="100%"
                href="/shared/device-xl.png"
              />
            )
          ) : (
            <></>
          )}
        </svg>
      </div>
    </div>
  );
}
