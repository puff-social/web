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
  LoraxCharacteristicPathMap,
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

  const [logsPercentage, setLogsPercentage] = useState(0);

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
    const { device, profiles } = await instance.init();
    setConnected(true);
    instance.once("gattdisconnect", () => disconnectDevice());

    toast(`Connected to ${instance.device.name}`, {
      position: "top-right",
      duration: 2000,
      icon: <BluetoothConnected />,
    });

    if (instance.device) {
      const session = await createDebuggingSession(
        instance.deviceMacAddress.replace(/:/g, "")
      );
      dispatch(setSessionId(session.data.id));
    }

    toast("Collecting device data and logs.", {
      position: "bottom-center",
      duration: 6000,
    });

    instance.on("logsPercentage", setLogsPercentage);

    try {
      await instance.setupDevice([
        LoraxCharacteristicPathMap[Characteristic.UTC_TIME],
      ]);

      setTimeout(async () => {
        try {
          await instance.readDeviceAuditLogs({ reverse: true });
        } catch (error) {
          setConnectionError(`readDeviceAuditLogs : ${error.toString()}`);
        }
      }, 1000);
    } catch (error) {
      setConnectionError(`setupDevice : ${error.toString()}`);
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
      deviceLogs: [...device.auditLogs].sort(
        (a: AuditLog, b: AuditLog) => b.id - a.id
      ),
    };

    console.log(data);

    await submitDebuggingSession(debugging.sessionId, data);
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

              <p className="p-1">
                If your puffco is doing weird things or not working in the
                application, try to pair with the button below and we'll do our
                best to pull any useful debugging data, we'll show you this data
                and give you a way to send it off for review by us.
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
                        <p className="font-bond">
                          Session ID : {debugging.sessionId}
                        </p>
                        <p>Device Name : {instance.device.name}</p>
                        <p>Device Serial : {instance.deviceSerialNumber}</p>
                        <p>Model : {instance.deviceModel}</p>
                        <p>Firmware : {instance.deviceFirmware}</p>
                        <p>Hardware : {instance.hardwareVersion}</p>
                        <p>MAC : {instance.deviceMacAddress}</p>
                        <p>Device Time : {device.utcTime}</p>
                        <p>
                          {new Date(device.utcTime * 1000).toLocaleString()}
                        </p>
                      </div>

                      {logsPercentage == 100 ? (
                        <button
                          className="flex w-full rounded-md bg-blue-600 hover:bg-blue-500 p-2 m-1 text-white font-bold justify-center items-center"
                          onClick={() => setDeviceLogsModalOpen(true)}
                        >
                          View device logs
                        </button>
                      ) : (
                        <></>
                      )}

                      <button
                        className="flex w-full rounded-md bg-blue-600 hover:bg-blue-500 p-2 m-1 text-white font-bold justify-center items-center"
                        disabled={logsPercentage != 100}
                        onClick={() => sendForReview()}
                      >
                        {logsPercentage == 100
                          ? "Send in for review"
                          : `Fetching logs from device ${(
                              logsPercentage ?? 0
                            ).toFixed(0)}%`}
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
