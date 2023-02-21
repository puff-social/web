import { useEffect, useState } from "react";
import styled from "styled-components";
import { PuffcoOperatingState } from "../types/gateway";

export interface DemoProps {
  activeColor?: { r: number; g: number; b: number };
  brightness?: number;
  battery?: number;
  temperature?: number;
  state?: PuffcoOperatingState;
  charging?: string;
}

export function OpalPuffcoContainer({
  id,
  demo,
}: {
  id: string;
  demo?: DemoProps;
}) {
  const [r, setRed] = useState(0);
  const [g, setGreen] = useState(0);
  const [b, setBlue] = useState(0);

  const [brightness, setBrightness] = useState(demo?.brightness || 100);
  const [activeColor] = useState(demo?.activeColor || { r: 0, g: 0, b: 0 });

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
    switch (demo?.charging) {
      case "Wireless":
      case "USB": {
        setBrightness(100);
        setRgb(255, 144, 0);
        interval = setInterval(() => {
          animateBrightness(100, 30, 5000);
          setTimeout(() => animateBrightness(30, 100, 5000), 5000);
        }, 10000);
        break;
      }
      default: {
        setBrightness(100);
        setRgb(0, 0, 0);
        break;
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [demo?.charging]);

  useEffect(() => {
    setBrightness(100);
    setRgb(activeColor.r, activeColor.g, activeColor.b);
  }, [activeColor]);

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
    <Main suppressHydrationWarning>
      <Puffco>
        <Svg>
          <image
            x="0"
            y="0"
            width="100%"
            height="100%"
            href="/opal/device.png"
          ></image>
        </Svg>
        <Svg>
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
                      0 0 0 ${(brightness * 1.5) / 100} 0`}
            ></feColorMatrix>
          </filter>
          <image
            x="0"
            y="0"
            width="100%"
            height="100%"
            filter={`url(#${id}-svg2Matrix)`}
            href="/opal/device-glass-mid-left.png"
          ></image>
        </Svg>
        <Svg>
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
                      0 0 0 ${(brightness * 1.5) / 100} 0`}
            ></feColorMatrix>
          </filter>
          <image
            x="0"
            y="0"
            width="100%"
            height="100%"
            filter={`url(#${id}-svg3Matrix)`}
            href="/opal/device-glass-mid-right.png"
          ></image>
        </Svg>
        <Svg>
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
                      0 0 0 ${(brightness * 1.5) / 100} 0`}
            ></feColorMatrix>
          </filter>
          <image
            x="0"
            y="0"
            width="100%"
            height="100%"
            filter={`url(#${id}-svg4Matrix)`}
            href="/opal/device-glass-far-left.png"
          ></image>
        </Svg>
        <Svg>
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
                      0 0 0 ${(brightness * 1.5) / 100} 0`}
            ></feColorMatrix>
          </filter>
          <image
            x="0"
            y="0"
            width="100%"
            height="100%"
            filter={`url(#${id}-svg5Matrix)`}
            href="/opal/device-glass-far-right.png"
          ></image>
        </Svg>
        <Svg>
          <filter
            id={`${id}-svg8Matrix`}
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
            filter={`url(#${id}-svg8Matrix)`}
            href="/opal/device-base-ring-mid-left.png"
          ></image>
        </Svg>
        <Svg>
          <filter
            id={`${id}-svg9Matrix`}
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
            filter={`url(#${id}-svg9Matrix)`}
            href="/opal/device-base-ring-mid-right.png"
          ></image>
        </Svg>
        <Svg>
          <filter
            id={`${id}-svg6Matrix`}
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
            filter={`url(#${id}-svg6Matrix)`}
            href="/opal/device-base-ring-far-left.png"
          ></image>
        </Svg>
        <Svg>
          <filter
            id={`${id}-svg7Matrix`}
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
            filter={`url(#${id}-svg7Matrix)`}
            href="/opal/device-base-ring-far-right.png"
          ></image>
        </Svg>
      </Puffco>
    </Main>
  );
}

export const Svg = styled.svg`
  position: absolute;
  display: flex;
  width: 35em;
  height: 35em;
`;

export const Puffco = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 40em;
  width: 18em;
`;

export const Main = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;
