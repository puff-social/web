import React from "react";
import NoSSR from "../components/NoSSR";
import { MainMeta } from "../components/MainMeta";
import { PuffcoContainer, DeviceProps } from "../components/puffco";
import {
  ChamberType,
  ChargeSource,
  ProductSeries,
  PuffcoOperatingState,
} from "@puff-social/commons/dist/puffco/constants";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const examples: {
  id: string;
  title: string;
  model?: string;
  chamberType?: ChamberType;
  productSeries?: ProductSeries;
  device?: DeviceProps;
  caption?: string;
}[] = [
  {
    id: "device-proxy",
    title: "Proxy Onyx",
    model: "onyx",
    productSeries: ProductSeries.Proxy,
    device: {
      activeColor: { r: 255, g: 50, b: 50 },
      brightness: 100,
      state: PuffcoOperatingState.HEAT_CYCLE_ACTIVE,
    },
    caption: "Testing",
  },
  {
    id: "device-proxy-haze",
    title: "Proxy Haze",
    model: "haze",
    productSeries: ProductSeries.Proxy,
    device: {
      activeColor: { r: 255, g: 50, b: 50 },
      brightness: 100,
      state: PuffcoOperatingState.HEAT_CYCLE_ACTIVE,
    },
    caption: "Testing",
  },
  {
    id: "device-peak-active",
    title: "Peak — Active",
    model: "peak",
    productSeries: ProductSeries.Pikachoid,
    device: {
      activeColor: { r: 255, g: 50, b: 50 },
      brightness: 100,
      state: PuffcoOperatingState.HEAT_CYCLE_ACTIVE,
    },
    caption: "Active — steady bright color",
  },
  {
    id: "device-storm-xl",
    title: "Storm — XL Chamber",
    model: "storm",
    productSeries: ProductSeries.Pikachoid,
    chamberType: ChamberType.XL,
    device: {
      activeColor: { r: 200, g: 80, b: 255 },
      brightness: 90,
      state: PuffcoOperatingState.IDLE,
    },
    caption: "Storm model with XL chamber overlay",
  },
];

export default function DeviceExamplesPage(): JSX.Element {
  return (
    <div className="flex flex-col min-h-screen">
      <MainMeta pageName="Device Component Examples" />

      <div className="m-4">
        <h1 className="text-3xl font-bold">puff.social — Device Examples</h1>
      </div>

      <NoSSR>
        <div className="flex flex-wrap m-4">
          {examples.map((ex) => (
            <div
              key={ex.id}
              className="flex justify-center items-center h-72 w-[440px] m-1"
            >
              <div
                id="card"
                className="group flex flex-col bg-neutral-100 dark:bg-neutral-800 rounded-md text-black dark:text-white drop-shadow-xl px-4 h-full w-[440px] justify-center items-center overflow-hidden"
              >
                <div className="flex flex-row w-full h-full items-center justify-center">
                  <PuffcoContainer
                    id={ex.id}
                    svgClassName={twMerge(
                      clsx(
                        { "w-40": ex.productSeries == ProductSeries.Pikachoid },
                        { "w-36": ex.productSeries == ProductSeries.Proxy },
                        "h-full",
                      ),
                    )}
                    className={"-z-50 min-w-[40%]"}
                    chamberType={ex.chamberType}
                    productSeries={ex.productSeries}
                    model={ex.model}
                    device={ex.device || { activeColor: { r: 0, g: 0, b: 0 } }}
                  />

                  <span className="flex flex-col p-4 w-full min-w-[60%]">
                    <span className="space-x-2 flex flex-row items-center">
                      <h1 className="m-0 text-xl font-bold truncate">
                        {ex.title}
                      </h1>
                    </span>

                    {ex.caption ? (
                      <p className="m-0 text-md opacity-70">{ex.caption}</p>
                    ) : null}

                    <div className="mt-4 flex space-x-4"></div>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </NoSSR>
    </div>
  );
}
