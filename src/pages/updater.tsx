import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";

import { MainMeta } from "../components/MainMeta";
import { Device } from "../utils/puffco";
import NoSSR from "../components/NoSSR";
import toast from "react-hot-toast";
import {
  BluetoothConnected,
  BluetoothDisabled,
} from "../components/icons/Bluetooth";

const instance = new Device();

export default function Updater() {
  const router = useRouter();

  const [connected, setConnected] = useState(false);

  const [bluetooth] = useState<boolean>(() => {
    if (typeof window == "undefined") return false;
    return typeof window.navigator.bluetooth !== "undefined";
  });

  const connectDevice = useCallback(async () => {
    const { device, profiles } = await instance.init();
    const { poller, initState, deviceInfo } = await instance.startPolling();
    setConnected(true);
    console.log(device, "device");
    console.log(profiles, "profiles");
    console.log(poller, "poller");
    console.log(initState, "initState");
    console.log(deviceInfo, "deviceInfo");
    toast(`Connected to ${instance.deviceName}`, {
      position: "top-right",
      duration: 2000,
      icon: <BluetoothConnected />,
    });
  }, []);

  const disconnectDevice = useCallback(async () => {
    instance.disconnect();
    toast(`Disconnected from ${instance.deviceName}`, {
      position: "top-right",
      duration: 2000,
      icon: <BluetoothDisabled />,
    });
    setConnected(false);
  }, []);

  return (
    <div className="flex flex-col justify-between h-screen">
      <MainMeta pageName="Updater" />

      <div
        className="flex flex-col m-4 z-10 cursor-pointer"
        onClick={() => router.push("/")}
      >
        <h1 className="text-4xl font-bold">puff.social</h1>
        <h3 className="text font-bold">Firmware Tool</h3>
      </div>

      <div className="flex flex-col space-y-8 m-4 pb-16">
        <div className="flex flex-col rounded-md space-y-3 justify-center">
          <div className="flex flex-col rounded-md bg-white dark:bg-neutral-800 p-2 m-3 w-[700px] text-black dark:text-white drop-shadow-xl">
            <div>
              <h2 className="text-xl font-bold p-1">
                Welcome to the Puffco Firmware tool
              </h2>

              <p className="p-1">
                This tool can be used to unbrick your puffco, and doubles as a
                super easy way to update the firmware on your puffco
              </p>
            </div>

            <hr className="rounded-md opacity-20 m-1" />

            <NoSSR>
              <div className="flex flex-col justify-center items-center">
                {bluetooth ? (
                  connected ? (
                    <>
                      <p>Device: {instance.deviceName}</p>

                      <button
                        className="flex w-full rounded-md bg-red-400 hover:bg-red-500 p-2 m-1 text-white font-bold justify-center items-center"
                        onClick={() => disconnectDevice()}
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="flex w-full rounded-md bg-blue-400 hover:bg-blue-500 p-2 m-1 text-white font-bold justify-center items-center"
                        onClick={() => connectDevice()}
                      >
                        Connect Device
                      </button>
                    </>
                  )
                ) : (
                  <>
                    <button
                      className="flex w-full rounded-md bg-blue-400 p-2 m-1 text-white font-bold justify-center items-center brightness-75"
                      disabled
                    >
                      Your device or browser doesn't support bluetooth
                    </button>
                  </>
                )}
              </div>
            </NoSSR>
          </div>
        </div>
      </div>

      <div />
    </div>
  );
}
