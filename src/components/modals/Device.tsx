import { Dialog, Transition } from "@headlessui/react";
import {
  Dispatch,
  Fragment,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import { DeviceInformation } from "../../types/api";
import { Device } from "../../utils/puffco";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker";
import { trackDevice } from "../../utils/hash";
import Tippy from "@tippyjs/react";
import { ChamberTypeMap } from "../../utils/puffco/constants";
import { Info } from "../icons/Info";
import {
  DeviceState,
  ProductModelMap,
} from "@puff-social/commons/dist/puffco/constants";

interface Props {
  instance: Device;
  device: DeviceState;
  info: DeviceInformation;
  modalOpen: boolean;
  setModalOpen: Function;
  setDeviceInfo: Dispatch<SetStateAction<DeviceInformation>>;
  setMyDevice: Dispatch<SetStateAction<DeviceState>>;
}

export function DeviceSettingsModal({
  instance,
  modalOpen,
  setModalOpen,
  device,
  info,
  setDeviceInfo,
  setMyDevice,
}: Props) {
  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const [brightness, setBrightness] = useState(device.brightness);

  const [deviceName, setDeviceName] = useState(device.deviceName);
  const [deviceDob, setDeviceDob] = useState(new Date(info.dob * 1000));

  const [badBirthday, setBadBirthday] = useState(false);

  useEffect(() => {
    if (info.dob) {
      const dob = new Date(info.dob * 1000);
      if (
        dob.getFullYear() > new Date().getFullYear() ||
        dob.getFullYear() < 2018
      )
        setBadBirthday(true);
      else setBadBirthday(false);
    }
  }, [info.dob]);

  const updateBirthday = useCallback(async () => {
    const current = new Date(info.dob * 1000);
    if (deviceDob.getTime() != current.getTime()) {
      deviceDob.setHours(4, 20, 0, 0);

      setBadBirthday(
        deviceDob.getFullYear() > new Date().getFullYear() ||
          deviceDob.getFullYear() < 2018
      );
      await instance.updateDeviceDob(deviceDob);
      setDeviceInfo((curr) => ({ ...curr, dob: deviceDob.getTime() / 1000 }));
      await trackDevice({
        ...info,
        name: deviceName,
        dob: deviceDob.getTime() / 1000,
      });
    }
  }, [deviceName, deviceDob]);

  const updateDevice = useCallback(async () => {
    if (deviceName != device.deviceName)
      await instance.updateDeviceName(deviceName);
    setMyDevice((curr) => ({ ...curr, deviceName }));
    await trackDevice({
      ...info,
      name: deviceName,
      dob: deviceDob.getTime() / 1000,
    });
    toast("Updated device");
    closeModal();
  }, [deviceName, deviceDob]);

  const updateBrightness = useCallback(async () => {
    instance.setBrightness(brightness);
    setMyDevice((curr) => ({ ...curr, brightness }));
    toast("Changed brightness", { duration: 1000 });
  }, [brightness]);

  return (
    <Transition appear show={modalOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-10"
        onClose={() => setModalOpen(false)}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-neutral-800 text-black dark:text-white p-6 text-left align-middle shadow-xl transition-all">
                <p className="font-bold m-1 text-center">Device</p>
                <span className="flex flex-col space-y-2">
                  <span>
                    <p className="font-bold">Name</p>
                    <input
                      value={deviceName}
                      placeholder="Device name"
                      maxLength={32}
                      className="w-full rounded-md p-2 mb-2 border-2 border-slate-300 text-black"
                      onChange={({ target: { value } }) => setDeviceName(value)}
                    />
                  </span>
                  <span className="flex justify-between">
                    <p className="font-bold">Model</p>
                    <Tippy
                      content={`Raw: ${device.deviceModel}`}
                      placement="bottom"
                    >
                      <p className="font-bold opacity-40">
                        {ProductModelMap[device.deviceModel]}
                      </p>
                    </Tippy>
                  </span>
                  <span className="flex justify-between">
                    <p className="font-bold">Firmware</p>
                    <p className="font-bold opacity-40">
                      {info.firmware} ({info.gitHash})
                    </p>
                  </span>
                  <span className="flex justify-between">
                    <p className="font-bold">Serial Number</p>
                    <p className="font-bold opacity-40">
                      {instance.deviceSerialNumber || "Unknown (Probably <=Z)"}
                    </p>
                  </span>
                  <span className="flex justify-between">
                    <p className="font-bold">MAC Address</p>
                    <p className="font-bold opacity-40">
                      {instance.deviceMacAddress}
                    </p>
                  </span>
                  <span className="flex justify-between">
                    <p className="font-bold">Hit Count</p>
                    <p className="font-bold opacity-40">
                      {device.totalDabs.toLocaleString()}
                    </p>
                  </span>
                  <span className="flex justify-between">
                    <p className="font-bold">Dab Avg (Per Day)</p>
                    <p className="font-bold opacity-40">{info.dabsPerDay}</p>
                  </span>
                  <span className="flex justify-between">
                    <p className="font-bold">Chamber Type</p>
                    <p className="font-bold opacity-40">
                      {ChamberTypeMap[device.chamberType]}
                    </p>
                  </span>
                  <span className="flex justify-between">
                    <p className="font-bold">Birthday</p>
                    <span className="flex items-center">
                      <p className="font-bold opacity-40">
                        {deviceDob.toLocaleDateString()}
                      </p>
                      {badBirthday ? (
                        <Tippy
                          interactive
                          placement="bottom"
                          content={
                            <div className="rounded-md p-2 bg-white dark:bg-neutral-800 drop-shadow-xl">
                              <p className=" text-black dark:text-white">
                                We detected that your device birthday is either
                                incorrect or was never set by the puffco
                                application, you can set one if you'd like.{" "}
                                <span className="text-sm opacity-40">
                                  (Get this right as you can't change it again.
                                  Well you can, but you'll have to ask special
                                  request to Dustin)
                                </span>
                              </p>
                              <hr className="my-2" />
                              <p className="font-bold">Device Date of Birth</p>
                              <DatePicker
                                popperPlacement="auto"
                                className="w-full rounded-md p-2 mt-2 border-2 border-slate-300 text-black"
                                filterDate={(date) =>
                                  date.getFullYear() <=
                                    new Date().getFullYear() &&
                                  date.getFullYear() >= 2018
                                }
                                selected={
                                  deviceDob.getFullYear() >
                                    new Date().getFullYear() ||
                                  deviceDob.getFullYear() < 2018
                                    ? null
                                    : deviceDob
                                }
                                startDate={new Date()}
                                onChange={(data) => setDeviceDob(data)}
                              />
                              <button
                                className="w-full self-center rounded-md bg-indigo-600 hover:bg-indigo-700 p-1 mt-3 text-white"
                                onClick={() => updateBirthday()}
                              >
                                Update Birthday
                              </button>
                            </div>
                          }
                        >
                          <span className="text-sm text-red-500">
                            <Info />
                          </span>
                        </Tippy>
                      ) : (
                        <></>
                      )}
                    </span>
                  </span>
                  <span className="flex justify-between">
                    <p className="font-bold">Lantern Brightness</p>
                    <span className="flex flex-row items-center justify-center">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={brightness}
                        onChange={({ target: { value } }) =>
                          setBrightness(Number(value))
                        }
                        onMouseUp={() => updateBrightness()}
                      />
                      <p className="font-bold pl-1">{brightness}%</p>
                    </span>
                  </span>
                </span>

                <button
                  className="w-full self-center rounded-md bg-indigo-600 hover:bg-indigo-700 p-1 mt-3 text-white"
                  onClick={() => updateDevice()}
                >
                  Save
                </button>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
