import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import toast from "react-hot-toast";

import NoSSR from "../components/NoSSR";
import { Device } from "../utils/puffco";
import { MainMeta } from "../components/MainMeta";
import useDetectiOS from "../hooks/useDetectIos";
import { selectDebuggingState, setSessionId } from "../state/slices/debugging";
import {
  BluetoothConnected,
  BluetoothDisabled,
} from "../components/icons/Bluetooth";
import { createDebuggingSession, submitDebuggingSession } from "../utils/hash";
import { Settings } from "../components/icons/Settings";
import {
  AuditLog,
  Characteristic,
  DynamicLoraxCharacteristics,
  LoraxCharacteristicPathMap,
  intArrayToMacAddress,
  numbersToLetters,
} from "@puff-social/commons/dist/puffco";
import { selectCurrentDeviceState } from "../state/slices/device";
import { Snowflake } from "../components/icons/Snowflake";

const instance = new Device();
if (typeof window != "undefined") window["instance"] = instance;

export default function FixDesert() {
  const router = useRouter();

  const [connectionError, setConnectionError] = useState("");

  const [connected, setConnected] = useState(false);

  const device = useSelector(selectCurrentDeviceState);

  const isiOS = useDetectiOS();

  const [bluetooth] = useState<boolean>(() => {
    if (typeof window == "undefined") return false;
    return typeof window.navigator.bluetooth !== "undefined";
  });

  useEffect(() => {
    if (isiOS && !bluetooth)
      window.location.href = `path-web-fullscreen://${location?.href}`;
  }, [isiOS, bluetooth]);

  const disconnectDevice = useCallback(async () => {
    instance.disconnect();
    toast(`Disconnected`, {
      position: "top-right",
      duration: 2000,
      icon: <BluetoothDisabled />,
    });
    setConnected(false);
  }, []);

  const connectDevice = useCallback(async () => {
    try {
      const { device, profiles } = await instance.init(true, false);
      setConnected(true);
      instance.once("gattdisconnect", () => disconnectDevice());

      toast(`Connected to ${instance.device.name}`, {
        position: "top-right",
        duration: 2000,
        icon: <BluetoothConnected />,
      });

      try {
        await instance.setupDevice([
          LoraxCharacteristicPathMap[Characteristic.UTC_TIME],
        ]);
      } catch (error) {
        console.error(error, "connectDevice");
        setConnectionError(`connectDevice : ${error.toString()}`);
      }
    } catch (error) {}
  }, [device]);

  const restoreProfileColors = useCallback(async () => {
    if (instance.isLorax) {
      toast(`Setting profile color for #$1`, {
        position: "top-right",
        duration: 500,
      });
      await instance.sendLoraxValueShort(
        DynamicLoraxCharacteristics[Characteristic.PROFILE_COLOR](0),
        Buffer.from([22, 233, 135, 0, 1, 0, 0, 0]),
      );
    }
  }, [device]);

  return (
    <div className="flex flex-col justify-between h-screen">
      <MainMeta pageName="Device Checklist Tool" />

      <div className="flex flex-col m-4 z-10 cursor-pointer">
        <h1 className="text-4xl font-bold">puff.social</h1>
        <h3 className="text font-bold">
          Device Output Checklist -{" "}
          <a className="underline" href="https://puffco.app">
            Back to puffco.app
          </a>
        </h3>
      </div>

      <div className="flex flex-col space-y-8 m-4 pb-16">
        <div className="flex flex-col rounded-md space-y-3 justify-center">
          <div className="flex flex-col rounded-md bg-white dark:bg-neutral-800 p-2 m-3 w-auto text-black dark:text-white drop-shadow-xl">
            <div>
              <h2 className="text-xl font-bold p-1">puff.social fix things</h2>

              <p className="p-1">
                We've collected some device defaults for things like profiles
                and moodlights, this stuff is fairly version specific and you
                shouldn't use any of these buttons unless you're running the
                latest firmware and have been instructed by someone at
                puff.social
              </p>
            </div>

            <hr className="rounded-md opacity-20 m-1" />

            <NoSSR>
              <div className="flex flex-col">
                {connectionError ? (
                  <>
                    <div>
                      <p>Something failed.</p>
                      <p>
                        Error: <pre>{connectionError}</pre>
                      </p>
                    </div>
                  </>
                ) : bluetooth ? (
                  connected && instance.device ? (
                    <div className="flex flex-col justify-start">
                      <div className="m-4">
                        <p>Device Name : {instance.device.name}</p>
                        <p>Device Time : {device.utcTime}</p>
                        <p>
                          {new Date(device.utcTime * 1000).toLocaleString()}
                        </p>
                      </div>

                      <button
                        className="flex w-full rounded-md bg-blue-600 hover:bg-blue-500 p-2 m-1 text-white font-bold justify-center items-center"
                        onClick={() => restoreProfileColors()}
                      >
                        Restore Profile Colors
                      </button>
                    </div>
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
                      className="flex w-full rounded-md bg-blue-400 p-2 my-1 text-white font-bold justify-center items-center brightness-75"
                      disabled
                    >
                      Your device or browser doesn't support bluetooth
                    </button>
                    <button
                      className="flex w-full rounded-md bg-blue-400 p-2 my-1 text-white font-bold justify-center items-center"
                      onClick={() =>
                        window.open(`path-web-fullscreen://${location.href}`)
                      }
                    >
                      Open in Path Browser
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
