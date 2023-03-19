import Modal from "react-modal";
import DatePicker from "react-datepicker";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";

import "react-datepicker/dist/react-datepicker.css";

import { GatewayMemberDeviceState } from "../../types/gateway";
import { DeviceInformation } from "../../types/api";
import { Info } from "../icons/Info";
import { Tippy } from "../Tippy";
import {
  ChamberTypeMap,
  ProductModelMap,
  updateDeviceDob,
  updateDeviceName,
} from "../../utils/puffco";
import toast from "react-hot-toast";
import { trackDevice } from "../../utils/analytics";

interface Props {
  device: GatewayMemberDeviceState;
  info: DeviceInformation;
  modalOpen: boolean;
  setModalOpen: Function;
  setDeviceInfo: Dispatch<SetStateAction<DeviceInformation>>;
  setMyDevice: Dispatch<SetStateAction<GatewayMemberDeviceState>>;
}

export function DeviceSettingsModal({
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
      await updateDeviceDob(deviceDob);
      setDeviceInfo((curr) => ({ ...curr, dob: deviceDob.getTime() / 1000 }));
      await trackDevice(
        { ...info, name: deviceName, dob: deviceDob.getTime() / 1000 },
        localStorage.getItem("puff-social-name") || "Unnamed"
      );
    }
  }, [deviceName, deviceDob]);

  const updateDevice = useCallback(async () => {
    await updateDeviceName(deviceName);
    setMyDevice((curr) => ({ ...curr, deviceName }));
    await trackDevice(
      { ...info, name: deviceName, dob: deviceDob.getTime() / 1000 },
      localStorage.getItem("puff-social-name") || "Unnamed"
    );
    toast("Updated device");
    closeModal();
  }, [deviceName, deviceDob]);

  return (
    <Modal
      isOpen={modalOpen}
      onRequestClose={closeModal}
      contentLabel="Device Settings Modal"
      style={{
        overlay: {
          background: "#00000070",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 200,
        },
        content: {
          inset: "unset",
          backgroundColor: "#00000000",
          border: "none",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 201,
          overflow: "inherit",
        },
      }}
    >
      <div className="flex flex-col m-2 p-4 rounded-md bg-white dark:bg-neutral-800 text-black dark:text-white">
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
            <Tippy content={`Raw: ${device.deviceModel}`} placement="bottom">
              <p className="font-bold opacity-40">
                {ProductModelMap[device.deviceModel]}
              </p>
            </Tippy>
          </span>
          <span className="flex justify-between">
            <p className="font-bold">Firmware</p>
            <p className="font-bold opacity-40">
              {info.firmware} ({info.hash})
            </p>
          </span>
          <span className="flex justify-between">
            <p className="font-bold">Hit Count</p>
            <p className="font-bold opacity-40">
              {device.totalDabs.toLocaleString()}
            </p>
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
                        incorrect or was never set by the puffco application,
                        you can set one if you'd like.{" "}
                        <span className="text-sm opacity-40">
                          (Get this right as you can't change it again. Well you
                          can, but you'll have to ask special request to Dustin)
                        </span>
                      </p>
                      <hr className="my-2" />
                      <p className="font-bold">Device Date of Birth</p>
                      <DatePicker
                        popperPlacement="auto"
                        className="w-full rounded-md p-2 mt-2 border-2 border-slate-300 text-black"
                        filterDate={(date) =>
                          date.getFullYear() <= new Date().getFullYear() &&
                          date.getFullYear() >= 2018
                        }
                        selected={
                          deviceDob.getFullYear() > new Date().getFullYear() ||
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
        </span>

        <button
          className="w-96 self-center rounded-md bg-indigo-600 hover:bg-indigo-700 p-1 mt-3 text-white"
          onClick={() => updateDevice()}
        >
          Save
        </button>
      </div>
    </Modal>
  );
}
