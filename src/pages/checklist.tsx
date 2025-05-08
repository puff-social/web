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
import { Tippy } from "../components/Tippy";
import { Stop } from "../components/icons/Stop";
import { Snowflake } from "../components/icons/Snowflake";

function formatMessage(template: string, ...args: any[]) {
  return template.replace(/\$(\d+)/g, (_, index) => {
    const argIndex = parseInt(index, 10) - 1;
    return args[argIndex];
  });
}

const Errors = {
  InvalidByteLength:
    "The returned buffer was a byte length of $1 expected was $2",
};

const instance = new Device();
if (typeof window != "undefined") window["instance"] = instance;

export default function ChecklistTool() {
  const router = useRouter();

  const [connectionError, setConnectionError] = useState("");

  const [connected, setConnected] = useState(false);

  const [testResults, setTestResults] = useState<
    {
      characteristic: string;
      value: any;
      expected: number | string;
      length: number;
      failure?: string;
    }[]
  >([]);

  const [fetchPercentage, setFetchPercentage] = useState(0);

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

  const insertTestResult = useCallback(
    (res: {
      characteristic: string;
      value: any;
      length: number;
      expected: number | string;
      failure?: string;
    }) => {
      setTestResults((tr) => [...tr, res]);
    },
    [testResults],
  );

  useEffect(() => {
    console.log(testResults);
  }, [testResults]);

  const connectDevice = useCallback(async () => {
    try {
      setFetchPercentage(0);
      const { device, profiles } = await instance.init(true, false);
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

      toast("Starting processes to fetch characteristics.", {
        position: "bottom-center",
        duration: 6000,
      });

      setFetchPercentage(5);

      try {
        await instance.setupDevice([
          LoraxCharacteristicPathMap[Characteristic.UTC_TIME],
        ]);

        setFetchPercentage(10);

        setTimeout(async () => {
          // Profile 1
          const temperatureCall = await instance.getValue(
            DynamicLoraxCharacteristics[Characteristic.PROFILE_PREHEAT_TEMP](0),
            true,
          );

          insertTestResult({
            characteristic:
              DynamicLoraxCharacteristics[Characteristic.PROFILE_PREHEAT_TEMP](
                0,
              ),
            length: temperatureCall.byteLength,
            expected: 4,
            value:
              temperatureCall.byteLength != 4
                ? temperatureCall.readFloatLE(0)
                : null,
            failure:
              temperatureCall.byteLength != 4
                ? formatMessage(
                    Errors.InvalidByteLength,
                    temperatureCall.byteLength,
                    4,
                  )
                : undefined,
          });

          const timeCall = await instance.getValue(
            DynamicLoraxCharacteristics[Characteristic.PROFILE_PREHEAT_TIME](0),
            true,
          );

          insertTestResult({
            characteristic:
              DynamicLoraxCharacteristics[Characteristic.PROFILE_PREHEAT_TIME](
                0,
              ),
            length: timeCall.byteLength,
            expected: 4,
            value: timeCall.byteLength != 4 ? timeCall.readFloatLE(0) : null,
            failure:
              timeCall.byteLength != 4
                ? formatMessage(
                    Errors.InvalidByteLength,
                    timeCall.byteLength,
                    4,
                  )
                : undefined,
          });

          const vaporModeCall = await instance.getValue(
            DynamicLoraxCharacteristics.PROFILE_INTENSITY(0),
            true,
          );

          insertTestResult({
            characteristic: DynamicLoraxCharacteristics.PROFILE_INTENSITY(0),
            length: vaporModeCall.byteLength,
            expected: 4,
            value:
              vaporModeCall.byteLength != 4
                ? vaporModeCall.readFloatLE(0)
                : null,
            failure:
              vaporModeCall.byteLength != 4
                ? formatMessage(
                    Errors.InvalidByteLength,
                    vaporModeCall.byteLength,
                    4,
                  )
                : undefined,
          });

          const colorCall = await instance.getValue(
            DynamicLoraxCharacteristics[Characteristic.PROFILE_COLOR](0),
            true,
          );

          insertTestResult({
            characteristic:
              DynamicLoraxCharacteristics[Characteristic.PROFILE_COLOR](0),
            length: colorCall.byteLength,
            expected: ">30 <=125",
            value: colorCall.join(", "),
            failure:
              colorCall.byteLength < 30 && colorCall.byteLength >= 125
                ? formatMessage(
                    Errors.InvalidByteLength,
                    colorCall.byteLength,
                    ">30 <=125",
                  )
                : undefined,
          });

          setFetchPercentage(20);

          const birthdayCall = await instance.getValue(
            LoraxCharacteristicPathMap[Characteristic.DEVICE_BIRTHDAY],
            true,
          );

          insertTestResult({
            characteristic:
              LoraxCharacteristicPathMap[Characteristic.DEVICE_BIRTHDAY],
            length: birthdayCall.byteLength,
            expected: 4,
            value:
              birthdayCall.byteLength != 4 ? birthdayCall.readFloatLE(0) : null,
            failure:
              birthdayCall.byteLength != 4
                ? formatMessage(
                    Errors.InvalidByteLength,
                    birthdayCall.byteLength,
                    4,
                  )
                : undefined,
          });

          const deviceHwModelCall = await instance.getValue(
            LoraxCharacteristicPathMap[Characteristic.HARDWARE_MODEL],
            true,
          );

          insertTestResult({
            characteristic:
              LoraxCharacteristicPathMap[Characteristic.HARDWARE_MODEL],
            length: deviceHwModelCall.byteLength,
            expected: 4,
            value:
              deviceHwModelCall.byteLength != 4
                ? deviceHwModelCall.readUInt32LE(0)
                : null,
            failure:
              deviceHwModelCall.byteLength != 4
                ? formatMessage(
                    Errors.InvalidByteLength,
                    deviceHwModelCall.byteLength,
                    4,
                  )
                : undefined,
          });

          const deviceHwVersionCall = await instance.getValue(
            LoraxCharacteristicPathMap[Characteristic.HARDWARE_VERSION],
            true,
          );

          insertTestResult({
            characteristic:
              LoraxCharacteristicPathMap[Characteristic.HARDWARE_VERSION],
            length: deviceHwVersionCall.byteLength,
            expected: 4,
            value:
              deviceHwVersionCall.byteLength != 4
                ? deviceHwVersionCall.readUInt8(0)
                : null,
            failure:
              deviceHwVersionCall.byteLength != 4
                ? formatMessage(
                    Errors.InvalidByteLength,
                    deviceHwVersionCall.byteLength,
                    4,
                  )
                : undefined,
          });

          setFetchPercentage(30);

          const deviceFwVersion = await instance.getValue(
            LoraxCharacteristicPathMap[Characteristic.FIRMWARE_VERSION],
            true,
          );

          insertTestResult({
            characteristic:
              LoraxCharacteristicPathMap[Characteristic.FIRMWARE_VERSION],
            length: deviceFwVersion.byteLength,
            expected: 4,
            value:
              deviceFwVersion.byteLength != 4
                ? numbersToLetters(deviceFwVersion.readUInt8(0) + 5)
                : null,
            failure:
              deviceFwVersion.byteLength != 4
                ? formatMessage(
                    Errors.InvalidByteLength,
                    deviceFwVersion.byteLength,
                    4,
                  )
                : undefined,
          });

          const gitHashCall = await instance.getValue(
            LoraxCharacteristicPathMap[Characteristic.GIT_HASH],
            true,
          );

          insertTestResult({
            characteristic: LoraxCharacteristicPathMap[Characteristic.GIT_HASH],
            length: gitHashCall.byteLength,
            expected: 7,
            value: gitHashCall.byteLength != 7 ? gitHashCall.toString() : null,
            failure:
              gitHashCall.byteLength != 7
                ? formatMessage(
                    Errors.InvalidByteLength,
                    gitHashCall.byteLength,
                    7,
                  )
                : undefined,
          });

          setFetchPercentage(40);

          const btMacCall = await instance.getValue(
            LoraxCharacteristicPathMap[Characteristic.BT_MAC],
            true,
          );

          insertTestResult({
            characteristic: LoraxCharacteristicPathMap[Characteristic.BT_MAC],
            length: btMacCall.byteLength,
            expected: 6,
            value:
              btMacCall.byteLength != 6
                ? intArrayToMacAddress(btMacCall)
                : null,
            failure:
              btMacCall.byteLength != 6
                ? formatMessage(
                    Errors.InvalidByteLength,
                    btMacCall.byteLength,
                    6,
                  )
                : undefined,
          });

          setFetchPercentage(50);

          const deviceSerialCall = await instance.getValue(
            LoraxCharacteristicPathMap[Characteristic.SERIAL_NUMBER],
            true,
          );

          insertTestResult({
            characteristic:
              LoraxCharacteristicPathMap[Characteristic.SERIAL_NUMBER],
            length: deviceSerialCall.byteLength,
            expected: 19,
            value:
              deviceSerialCall.byteLength != 19
                ? deviceSerialCall.toString()
                : null,
            failure:
              deviceSerialCall.byteLength != 19
                ? formatMessage(
                    Errors.InvalidByteLength,
                    deviceSerialCall.byteLength,
                    19,
                  )
                : undefined,
          });

          setFetchPercentage(60);

          const chamberTypeCall = await instance.getValue(
            LoraxCharacteristicPathMap[Characteristic.CHAMBER_TYPE],
            true,
          );

          insertTestResult({
            characteristic:
              LoraxCharacteristicPathMap[Characteristic.CHAMBER_TYPE],
            length: chamberTypeCall.byteLength,
            expected: 1,
            value:
              chamberTypeCall.byteLength != 1
                ? chamberTypeCall.toString()
                : null,
            failure:
              chamberTypeCall.byteLength != 1
                ? formatMessage(
                    Errors.InvalidByteLength,
                    chamberTypeCall.byteLength,
                    1,
                  )
                : undefined,
          });

          setFetchPercentage(70);

          const batteryChargeCall = await instance.getValue(
            LoraxCharacteristicPathMap[Characteristic.BATTERY_SOC],
            true,
          );

          insertTestResult({
            characteristic:
              LoraxCharacteristicPathMap[Characteristic.BATTERY_SOC],
            length: batteryChargeCall.byteLength,
            expected: 4,
            value:
              batteryChargeCall.byteLength != 4
                ? batteryChargeCall.toString()
                : null,
            failure:
              batteryChargeCall.byteLength != 4
                ? formatMessage(
                    Errors.InvalidByteLength,
                    batteryChargeCall.byteLength,
                    4,
                  )
                : undefined,
          });

          const batteryChargeSourceCall = await instance.getValue(
            LoraxCharacteristicPathMap[Characteristic.BATTERY_CHARGE_SOURCE],
            true,
          );

          insertTestResult({
            characteristic:
              LoraxCharacteristicPathMap[Characteristic.BATTERY_CHARGE_SOURCE],
            length: batteryChargeSourceCall.byteLength,
            expected: instance.isLorax ? 1 : 4,
            value:
              batteryChargeSourceCall.byteLength != (instance.isLorax ? 1 : 4)
                ? batteryChargeSourceCall.toString()
                : null,
            failure:
              batteryChargeSourceCall.byteLength != (instance.isLorax ? 1 : 4)
                ? formatMessage(
                    Errors.InvalidByteLength,
                    batteryChargeSourceCall.byteLength,
                    instance.isLorax ? 1 : 4,
                  )
                : undefined,
          });

          const totalHeatCyclesCall = await instance.getValue(
            LoraxCharacteristicPathMap[Characteristic.TOTAL_HEAT_CYCLES],
            true,
          );

          insertTestResult({
            characteristic:
              LoraxCharacteristicPathMap[Characteristic.TOTAL_HEAT_CYCLES],
            length: totalHeatCyclesCall.byteLength,
            expected: 4,
            value:
              totalHeatCyclesCall.byteLength != 4
                ? totalHeatCyclesCall.toString()
                : null,
            failure:
              totalHeatCyclesCall.byteLength != 4
                ? formatMessage(
                    Errors.InvalidByteLength,
                    totalHeatCyclesCall.byteLength,
                    4,
                  )
                : undefined,
          });

          const avgHeatCycles = await instance.getValue(
            LoraxCharacteristicPathMap[Characteristic.DABS_PER_DAY],
            true,
          );

          insertTestResult({
            characteristic:
              LoraxCharacteristicPathMap[Characteristic.DABS_PER_DAY],
            length: avgHeatCycles.byteLength,
            expected: 4,
            value:
              avgHeatCycles.byteLength != 4 ? avgHeatCycles.toString() : null,
            failure:
              avgHeatCycles.byteLength != 4
                ? formatMessage(
                    Errors.InvalidByteLength,
                    avgHeatCycles.byteLength,
                    4,
                  )
                : undefined,
          });

          setFetchPercentage(100);
        }, 1000);
      } catch (error) {
        console.error(error, "loraxProfiles");
        setConnectionError(`setupDevice : ${error.toString()}`);
      }
    } catch (error) {
      console.error(error, "loraxProfiles");
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
    toast("Sending device settings and test results for review", {
      position: "top-right",
      duration: 2000,
      icon: <Settings />,
    });

    const data = {
      name: instance.device.name,
      mac: instance.deviceMacAddress,
      model: instance.deviceModel,
      hardwareVersion: instance.hardwareVersion,
      firmware: instance.deviceFirmware,
      dob: (
        await instance.getValue(Characteristic.DEVICE_BIRTHDAY, true)
      ).readUInt32LE(0),
      utcTime: device.utcTime,
      testResults,
    };

    console.log(data);

    await submitDebuggingSession(debugging.sessionId, data, "deviceChecklist");
  }, [testResults, debugging, device]);

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
              <h2 className="text-xl font-bold p-1">
                puff.social firmware checklist
              </h2>

              <p className="p-1">
                This tool will read nearly all the main paths/characteristics
                from the device and compare the returned byte length against the
                expected byte length for each value to show you any differences
                caused by your current firmware or hardware.
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
                  connected && instance.device && debugging.sessionId ? (
                    <div className="flex flex-col justify-start">
                      <div className="m-4">
                        <p className="font-bond">
                          Session ID : {debugging.sessionId}
                        </p>
                        <p>Device Name : {instance.device.name}</p>
                        <p>Device Time : {device.utcTime}</p>
                        <p>
                          {new Date(device.utcTime * 1000).toLocaleString()}
                        </p>
                      </div>

                      {fetchPercentage == 100 ? (
                        <div className="flex flex-col md:flex-row`">
                          {testResults.map((tr, idx) => (
                            <div className="p-1 m-1 rounded-md bg-neutral-600">
                              {tr.failure ? (
                                <div className="m-1 p-1 bg-yellow-700 rounded-md flex flex-row space-x-1">
                                  <p>{tr.failure}</p>
                                  <Snowflake />
                                </div>
                              ) : (
                                <></>
                              )}
                              <p>Path: {tr.characteristic}</p>
                              <p>Byte Length: {tr.length}</p>
                              {tr.expected ? (
                                <p>Expected: {tr.expected}</p>
                              ) : (
                                <></>
                              )}
                              <p>Data: {tr.value}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <></>
                      )}

                      <button
                        className="flex w-full rounded-md bg-blue-600 hover:bg-blue-500 p-2 m-1 text-white font-bold justify-center items-center"
                        disabled={fetchPercentage != 100}
                        onClick={() => sendForReview()}
                      >
                        {fetchPercentage == 100
                          ? "Send in for review"
                          : `Fetching logs from device ${(
                              fetchPercentage ?? 0
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
