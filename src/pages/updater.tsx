import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

import { MainMeta } from "../components/MainMeta";
import { Device } from "../utils/puffco";
import NoSSR from "../components/NoSSR";
import toast from "react-hot-toast";
import {
  BluetoothConnected,
  BluetoothDisabled,
} from "../components/icons/Bluetooth";
import { Firmwares } from "../utils/puffco/firmwares";
import { fetchFirmwareFile } from "../utils/functions";
import useDetectiOS from "../hooks/useDetectIos";
import { useDispatch, useSelector } from "react-redux";
import { selectUpdaterState, setProgress } from "../state/slices/updater";

const instance = new Device();
if (typeof window != "undefined") window["instance"] = instance;

export default function Updater() {
  const router = useRouter();

  const [gitHash, setGitHash] = useState(instance.gitHash);
  const [isPup, setIsPup] = useState(instance.isPup);
  const [firmwares] = useState(Firmwares);
  const [selectedFirmware, setSelectedFirmware] = useState(
    instance.deviceFirmware || "AF"
  );
  const selectedFwFiles = useMemo(
    () =>
      firmwares
        .filter((fw) =>
          fw.files.find((file) => file.type == (isPup ? "puff" : "GBL"))
        )
        .find((fw) => fw.name == selectedFirmware)
        ?.files.filter((file) => file.type == (isPup ? "puff" : "GBL")),
    [selectedFirmware, firmwares, isPup]
  );

  const [waitingOta, setWaitingOta] = useState(false);
  const [hasService, setHasService] = useState(false);

  const [selectedFileId, setSelectedFileId] = useState<number>(6);
  const selectedFile = useMemo(
    () => selectedFwFiles?.find((file) => file.id == selectedFileId),
    [selectedFwFiles, selectedFileId]
  );

  useEffect(() => {
    setSelectedFileId(selectedFwFiles?.[0].id);
  }, [selectedFirmware, selectedFwFiles]);

  const [otaDeviceIndetifier, setOtaDeviceIndetifier] = useState<string>();
  const [connected, setConnected] = useState(false);

  const updater = useSelector(selectUpdaterState);
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
    const { device, mac } = await instance.initOta();
    setConnected(true);
    instance.once("gattdisconnect", () => disconnectDevice());

    toast(`Connected to ${instance.device.name}`, {
      position: "top-right",
      duration: 2000,
      icon: <BluetoothConnected />,
    });

    setIsPup(instance.isPup);
    setHasService(instance.hasService);
    if (instance.hasService) {
      setSelectedFirmware(instance.deviceFirmware);
      setGitHash(instance.gitHash);
      setOtaDeviceIndetifier(mac.replace(/:/g, ""));
      setSelectedFileId(
        firmwares
          .filter((fw) =>
            fw.files.find((file) => file.type == (isPup ? "puff" : "GBL"))
          )
          .find((fw) => fw.name == selectedFirmware)
          ?.files.filter((file) => file.type == (isPup ? "puff" : "GBL"))
          .find((file) => file.hash == instance.gitHash)?.id
      );
    } else {
      await instance.startTransfer();

      toast(`Now choose the firmware you want to flash and click flash`, {
        position: "bottom-center",
        duration: 6000,
      });
    }
  }, [selectedFwFiles]);

  const disconnectDevice = useCallback(async () => {
    instance.disconnect();
    toast(`Disconnected`, {
      position: "top-right",
      duration: 2000,
      icon: <BluetoothDisabled />,
    });
    setConnected(false);
  }, []);

  const updateToFirmware = useCallback(async () => {
    toast("Putting device in app loader mode", {
      position: "bottom-center",
      duration: 3000,
    });
    await instance.rebootToAppLoader();
    toast(
      `Please click connect again and this time choose "${otaDeviceIndetifier}"`,
      {
        position: "bottom-center",
        duration: 10000,
      }
    );
  }, [otaDeviceIndetifier]);

  const startFirmwareUpdate = useCallback(async () => {
    setWaitingOta(true);

    dispatch(setProgress(0.1));
    toast("Downloading firmware", {
      position: "bottom-center",
      duration: 2000,
    });

    try {
      const firmware = await fetchFirmwareFile(selectedFile.file);
      const filename =
        selectedFile.file.split("/")[selectedFile.file.split("/").length - 1];

      dispatch(setProgress(0.2));

      const match =
        /([A-Z]{1,2})-([a-zA-Z].*)-(application|[a-zA-Z].*-[a-zA-Z].*)-([0-9a-zA-Z]{7})-release.(gbl|puff)/.exec(
          filename
        );
      if (!match) return;

      const [, indentifier, , name, gitHash] = match;

      toast(`Downloaded ${indentifier} - ${name} (${gitHash})`, {
        position: "bottom-center",
        duration: 10000,
      });

      toast(
        `Starting write to device, may take a few minutes, please don't touch the device.`,
        {
          position: "bottom-center",
          duration: 10000,
        }
      );

      console.log("Write");
      await instance.writeFirmware(firmware);

      toast(`Write complete, verifying firmware and restarting device.`, {
        position: "bottom-center",
        duration: 10000,
      });

      if (isPup) {
        console.log("Verify");
        instance.verifyTransfer();
      } else {
        console.log("End");
        await instance.endTransfer();

        console.log("Disconnect");
        setWaitingOta(false);
      }

      dispatch(setProgress(1));

      setTimeout(() => {
        instance.disconnect();
      }, 1000);
    } catch (error) {
      console.error("error", error);
    }
  }, [selectedFile, isPup]);

  return (
    <div className="flex flex-col justify-between h-screen">
      <MainMeta pageName="Updater" />

      <div className="flex flex-col m-4 z-10 cursor-pointer">
        <h1 className="text-4xl font-bold">puff.social</h1>
        <h3 className="text font-bold">
          Firmware Tool -{" "}
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
                Welcome to the Puffco Firmware tool
              </h2>

              <p className="p-1">
                This tool can be used to unbrick your puffco, and doubles as a
                super easy way to update the firmware on your puffco
              </p>
            </div>

            <hr className="rounded-md opacity-20 m-1" />

            <NoSSR>
              <div className="flex flex-col">
                {bluetooth ? (
                  connected && instance.device ? (
                    waitingOta ? (
                      <>
                        <p>Device: {instance.device.name}</p>
                        <div className="flex flex-col justify-start">
                          <p>
                            Awaiting flash to{" "}
                            <span className="font-bold">
                              {selectedFirmware} - {selectedFile.hash}
                            </span>{" "}
                            - {(updater.progress * 100).toFixed(0)}%
                          </p>
                        </div>
                      </>
                    ) : hasService ? (
                      <>
                        <p>Device: {instance.device.name}</p>
                        <p>
                          Current Firmware: {instance.deviceFirmware} -{" "}
                          {instance.gitHash}
                        </p>

                        <hr />

                        {isPup ? (
                          <div className="flex flex-col justify-start">
                            <p>
                              Click below to put your device in firmware upload
                              mode (App Loader) and the next screen will have
                              valid firmwares to flash.
                            </p>

                            <button
                              className="flex w-full rounded-md bg-blue-600 hover:bg-blue-500 p-2 m-1 text-white font-bold justify-center items-center"
                              onClick={() => updateToFirmware()}
                            >
                              Reboot to App Loader (DFW)
                            </button>
                          </div>
                        ) : (
                          <div>
                            <p>
                              Your device is not of the new internals, currently
                              working on support for the older SoCs and soon
                              you'll be able to manage your firmware here.
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <p>Device: {instance.device.name}</p>

                        <hr />

                        <div className="flex flex-col justify-start">
                          <p>Change Device Firmware</p>

                          <div className="flex flex-row">
                            <select
                              className="p-2 m-1 rounded-md bg-neutral-700 text-white"
                              onChange={({ target: { value } }) => {
                                setSelectedFirmware(value);
                              }}
                            >
                              {firmwares
                                .filter((fw) =>
                                  fw.files.find(
                                    (file) =>
                                      file.type == (isPup ? "puff" : "GBL")
                                  )
                                )
                                .map((fw, index) => (
                                  <option
                                    key={index}
                                    selected={selectedFirmware == fw.name}
                                    value={fw.name}
                                  >
                                    {fw.name}
                                  </option>
                                ))}
                            </select>
                            <select
                              onChange={({ target: { value } }) => {
                                console.log("changing", value);
                                setSelectedFileId(Number(value));
                              }}
                              className="p-2 m-1 rounded-md bg-neutral-700 text-white"
                            >
                              {selectedFwFiles?.map((file, index) => (
                                <option
                                  key={index}
                                  selected={selectedFileId == file.id}
                                  value={file.id}
                                >
                                  {file.hash} - {file.type}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <button
                          className="flex w-full rounded-md bg-blue-600 hover:bg-blue-500 p-2 m-1 text-white font-bold justify-center items-center"
                          onClick={() => startFirmwareUpdate()}
                        >
                          Update
                        </button>

                        <button
                          className="flex w-full rounded-md bg-red-400 hover:bg-red-500 p-2 m-1 text-white font-bold justify-center items-center"
                          onClick={() => disconnectDevice()}
                        >
                          Disconnect
                        </button>
                      </>
                    )
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
