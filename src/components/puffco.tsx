import { PropsWithoutRef, useEffect, useState } from "react";
import usePrefersColorScheme from "use-prefers-color-scheme";

import { PuffcoOperatingState } from "../types/gateway";
import { ChargeSource } from "../utils/puffco";

export interface DemoProps {
  activeColor?: { r: number; g: number; b: number };
  brightness?: number;
  battery?: number;
  temperature?: number;
  state?: PuffcoOperatingState;
  chargeSource?: ChargeSource;
}

export function PuffcoContainer({
  id,
  demo,
  model = "peak",
  className,
}: {
  id: string;
  demo?: DemoProps;
  model?: string;
} & PropsWithoutRef<any>) {
  const [r, setRed] = useState(0);
  const [g, setGreen] = useState(0);
  const [b, setBlue] = useState(0);

  const prefersColorScheme = usePrefersColorScheme();

  const [brightness, setBrightness] = useState(demo?.brightness || 100);

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
    switch (demo?.chargeSource) {
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
  }, [demo?.chargeSource]);

  useEffect(() => {
    setBrightness(100);
    setRgb(demo.activeColor.r, demo.activeColor.g, demo.activeColor.b);
  }, [demo.activeColor]);

  useEffect(() => {
    let interval: NodeJS.Timer;
    switch (demo?.state) {
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
  }, [demo?.state]);

  return (
    <div
      className={`flex flex-col justify-center items-center ${className}`}
      suppressHydrationWarning
    >
      <div
        className={`flex justify-center items-center self-center h-full w-full`}
      >
        <svg className="flex absolute w-full h-full">
          <image
            x="0"
            y="0"
            width="100%"
            height="100%"
            href={`/${model}/${
              model == "opal"
                ? prefersColorScheme == "dark"
                  ? "device"
                  : "device-light-bg"
                : "device"
            }.png`}
          ></image>
        </svg>
        <svg className="flex absolute w-full h-full">
          <filter
            id={`${id}-svg2Matrix`}
            x="0"
            y="0"
            width="100%"
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
            x="0"
            y="0"
            width="100%"
            height="100%"
            filter={`url(#${id}-svg2Matrix)`}
            href={`/peak/device-glass-left.png`}
          ></image>
        </svg>
        <svg className="flex absolute w-full h-full">
          <filter
            id={`${id}-svg3Matrix`}
            x="0"
            y="0"
            width="100%"
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
            x="0"
            y="0"
            width="100%"
            height="100%"
            filter={`url(#${id}-svg3Matrix)`}
            href={`/peak/device-glass-right.png`}
          ></image>
        </svg>
        <svg className="flex absolute w-full h-full">
          <filter
            id={`${id}-svg4Matrix`}
            x="0"
            y="0"
            width="100%"
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
            x="0"
            y="0"
            width="100%"
            height="100%"
            filter={`url(#${id}-svg4Matrix)`}
            href={`/peak/device-base-left.png`}
          ></image>
        </svg>
        <svg className="flex absolute w-full h-full">
          <filter
            id={`${id}-svg5Matrix`}
            x="0"
            y="0"
            width="100%"
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
            x="0"
            y="0"
            width="100%"
            height="100%"
            filter={`url(#${id}-svg5Matrix)`}
            href={`/peak/device-base-right.png`}
          ></image>
        </svg>
      </div>
    </div>
  );
}
