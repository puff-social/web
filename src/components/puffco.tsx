import { PropsWithoutRef, useEffect, useState } from "react";
import usePrefersColorScheme from "use-prefers-color-scheme";

import { PuffcoOperatingState } from "../types/gateway";
import { ChargeSource } from "../utils/puffco";

export interface DeviceProps {
  svgClassName?: string;
  activeColor?: { r: number; g: number; b: number };
  brightness?: number;
  battery?: number;
  temperature?: number;
  state?: PuffcoOperatingState;
  chargeSource?: ChargeSource;
}

export function PuffcoContainer({
  id,
  device,
  model = "peak",
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
    let interval: NodeJS.Timer;
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
    setRgb(device.activeColor.r, device.activeColor.g, device.activeColor.b);
  }, [device.activeColor]);

  useEffect(() => {
    let interval: NodeJS.Timer;
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
          <image
            className="flex justify-center items-center self-center"
            height="100%"
            href={`/${model}/${
              model == "opal"
                ? prefersColorScheme == "dark"
                  ? "device"
                  : "device-light-bg"
                : "device"
            }.png`}
          />
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
                        0 0 0 ${brightness / 100} 0`}
            ></feColorMatrix>
          </filter>
          <image
            className="flex justify-center items-center self-center"
            height="100%"
            filter={`url(#${id}-svg-matrix)`}
            href={`/peak/device-glass-left.png`}
          />
          <image
            className="flex justify-center items-center self-center"
            height="100%"
            filter={`url(#${id}-svg-matrix)`}
            href={`/peak/device-glass-right.png`}
          />
          <image
            className="flex justify-center items-center self-center"
            height="100%"
            filter={`url(#${id}-svg-matrix)`}
            href={`/peak/device-base-left.png`}
          />
          <image
            className="flex justify-center items-center self-center"
            height="100%"
            filter={`url(#${id}-svg-matrix)`}
            href={`/peak/device-base-right.png`}
          />
        </svg>
      </div>
    </div>
  );
}
