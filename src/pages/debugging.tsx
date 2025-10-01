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
  DeviceCommand,
  LoraxCharacteristicPathMap,
  ProductModelMap,
  ProductSeriesMap,
} from "@puff-social/commons/dist/puffco";
import { DeviceLogsModal } from "../components/modals/DeviceLogs";
import { selectCurrentDeviceState } from "../state/slices/device";

const instance = new Device();
if (typeof window != "undefined") window["instance"] = instance;

export default function Updater() {
  const router = useRouter();

  const [connectionError, setConnectionError] = useState("");

  const [connected, setConnected] = useState(false);
  const [deviceLogsModalOpen, setDeviceLogsModalOpen] = useState(false);

  const device = useSelector(selectCurrentDeviceState);
  const debugging = useSelector(selectDebuggingState);
  const dispatch = useDispatch();

  const isiOS = useDetectiOS();

  const [bluetooth] = useState<boolean>(() => {
    if (typeof window == "undefined") return false;
    return typeof window.navigator.bluetooth !== "undefined";
  });

  useEffect(() => {
    if (isiOS && !bluetooth)
      window.location.href = `path-web-fullscreen://${location?.href}`;
  }, [isiOS, bluetooth]);

  const connectDevice = useCallback(async () => {
    try {
      const { device, profiles } = await instance.init(false);
      setConnected(true);
      instance.once("gattdisconnect", () => disconnectDevice());

      toast(`Connected to ${instance.device.name}`, {
        position: "top-right",
        duration: 2000,
        icon: <BluetoothConnected />,
      });

      if (instance.device) {
        const session = await createDebuggingSession(
          instance.deviceMacAddress.replace(/:/g, ""),
        );
        dispatch(setSessionId(session.data.id));
      }

      toast("Collecting device info.", {
        position: "bottom-center",
        duration: 1000,
      });

      try {
        await instance.setupDevice([
          LoraxCharacteristicPathMap[Characteristic.UTC_TIME],
        ]);
      } catch (error) {
        setConnectionError(`setupDevice : ${error.toString()}`);
      }
    } catch (error) {
      setConnectionError(`connectDevice : ${error.toString()}`);
    }
  }, []);

  const disconnectDevice = useCallback(async () => {
    instance.disconnect();
    toast(`Disconnected`, {
      position: "top-right",
      duration: 2000,
      icon: <BluetoothDisabled />,
    });
    setConnected(false);
  }, []);

  const sendForReview = useCallback(async () => {
    toast("Sending device settings and logs off for review", {
      position: "top-right",
      duration: 2000,
      icon: <Settings />,
    });

    const data = {
      name: instance.deviceName,
      serial: instance.deviceSerialNumber,
      mac: instance.deviceMacAddress,
      model: instance.deviceModel,
      hardwareVersion: instance.hardwareVersion,
      firmware: instance.deviceFirmware,
      gitHash: instance.gitHash,
      chamberType: instance.chamberType,
      dob: (
        await instance.getValue(Characteristic.DEVICE_BIRTHDAY, true)
      ).readUInt32LE(0),
      utcTime: device.utcTime,
      apiVersion: instance.apiVersion,
      apiSeries: instance.apiSeries,
    };

    console.log(data);

    await submitDebuggingSession(
      debugging.sessionId,
      data,
      "api_version_testing",
    );
  }, [debugging, device]);

  return (
    <div className="flex flex-col justify-between h-screen">
      <MainMeta pageName="Debugging Tool" />

      {connected ? (
        <>
          <DeviceLogsModal
            instance={instance}
            modalOpen={deviceLogsModalOpen}
            setModalOpen={setDeviceLogsModalOpen}
          />
        </>
      ) : (
        <></>
      )}

      <div className="flex flex-col m-4 z-10 cursor-pointer">
        <h1 className="text-4xl font-bold">puff.social</h1>
        <h3 className="text font-bold">
          Debuggin Tool -{" "}
          <a className="underline" href="https://puffco.app">
            Back to puffco.app
          </a>
        </h3>
      </div>

      <div className="flex flex-col space-y-8 m-4 pb-16">
        <div className="flex flex-col rounded-md space-y-3 justify-center">
          <div className="flex flex-col rounded-md bg-white dark:bg-neutral-800 p-2 m-3 w-auto text-black dark:text-white drop-shadow-xl">
            <div>
              <h2 className="text-xl font-bold p-1">
                puff.social device debugging tool
              </h2>

              <p className="p-1 font-bold">
                <span className="text-red-400">STOP!</span> If you were not sent
                this by a puff.social team member, please do not proceed here.
              </p>
              <p className="p-1">
                This will connect to your device and retrieve information about
                the device to help us understand more about various devices.
              </p>
            </div>

            <hr className="rounded-md opacity-20 m-1" />

            <NoSSR>
              <div className="flex flex-col">
                {connectionError ? (
                  <>
                    <div>
                      <p>The debugging attempt failed.</p>
                      <p>
                        Error: <pre>{connectionError}</pre>
                      </p>
                    </div>
                  </>
                ) : bluetooth ? (
                  connected && instance.device && debugging.sessionId ? (
                    <div className="flex flex-col justify-start">
                      <div className="m-4">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Session ID
                          </div>
                          <div className="text-sm">{debugging.sessionId}</div>

                          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Device Name
                          </div>
                          <div className="text-sm">{instance.device.name}</div>

                          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Device Serial
                          </div>
                          <div className="text-sm">
                            {instance.deviceSerialNumber}
                          </div>

                          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Model
                          </div>
                          <div className="text-sm">
                            {instance.deviceModel} (
                            {ProductModelMap[instance.deviceModel] ?? "Unknown"}
                            )
                          </div>

                          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            API Version
                          </div>
                          <div className="text-sm">{instance.apiVersion}</div>

                          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            API Series
                          </div>
                          <div className="text-sm">
                            {instance.apiSeries} (
                            {ProductSeriesMap[instance.apiSeries] ?? "Unknown"})
                          </div>

                          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Firmware
                          </div>
                          <div className="text-sm">
                            {instance.deviceFirmware} ({instance.gitHash})
                          </div>

                          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Hardware
                          </div>
                          <div className="text-sm">
                            {instance.hardwareVersion}
                          </div>

                          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            MAC
                          </div>
                          <div className="text-sm">
                            {instance.deviceMacAddress}
                          </div>

                          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Device Time (UTC)
                          </div>
                          <div className="text-sm">{device.utcTime}</div>

                          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Local Time
                          </div>
                          <div className="text-sm">
                            {new Date(device.utcTime * 1000).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        {Object.keys(instance.profiles).map((key) => (
                          <button
                            key={instance.profiles[key].id}
                            className="flex w-full rounded-md bg-green-600 p-2 m-1 text-white font-bold justify-center items-center"
                            onClick={() =>
                              instance.sendCommand(
                                DeviceCommand.TEMP_SELECT_STOP,
                              ) &&
                              instance.switchProfile(Number(key)) &&
                              instance.sendCommand(
                                DeviceCommand.TEMP_SELECT_BEGIN,
                              )
                            }
                          >
                            {instance.profiles[key].name}
                          </button>
                        ))}
                      </div>

                      <div className="flex space-x-2">
                        <button
                          className="flex w-full rounded-md bg-green-600 p-2 m-1 text-white font-bold justify-center items-center"
                          onClick={() =>
                            instance.sendCommand(
                              DeviceCommand.TEMP_SELECT_BEGIN,
                            ) &&
                            instance.sendCommand(DeviceCommand.SWITCH_PROFILE)
                          }
                        >
                          Switch Profile
                        </button>
                        <button
                          className="flex w-full rounded-md bg-green-600 p-2 m-1 text-white font-bold justify-center items-center"
                          onClick={() =>
                            instance.sendCommand(DeviceCommand.HEAT_CYCLE_BEGIN)
                          }
                        >
                          Start Heating
                        </button>
                        <button
                          className="flex w-full rounded-md bg-red-600 p-2 m-1 text-white font-bold justify-center items-center"
                          onClick={() =>
                            instance.sendCommand(DeviceCommand.HEAT_CYCLE_STOP)
                          }
                        >
                          Stop Heating
                        </button>
                      </div>

                      <button
                        className="flex w-full rounded-md bg-blue-600 hover:bg-blue-500 p-2 m-1 text-white font-bold justify-center items-center"
                        onClick={() => sendForReview()}
                      >
                        Send in for review
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
