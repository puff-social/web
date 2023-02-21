import Modal from "react-modal";
import toast from "react-hot-toast";
import { useCallback, useState } from "react";

import { gateway, Op } from "../../utils/gateway";

export function SettingsModal({ modalOpen, setModalOpen }: any) {
  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const [deviceType, setDeviceType] = useState(() =>
    typeof localStorage != "undefined"
      ? localStorage.getItem("puff-social-device-type") || "peak"
      : "peak"
  );

  const [ourName, setOurName] = useState(() =>
    typeof localStorage != "undefined"
      ? localStorage.getItem("puff-social-name") || "Unnamed"
      : "Unnamed"
  );

  const saveSettings = useCallback(() => {
    gateway.send(Op.UpdateUser, { name: ourName, device_type: deviceType });
    localStorage.setItem("puff-social-name", ourName);
    localStorage.setItem("puff-social-device-type", deviceType);
    toast("Updated user settings");
    closeModal();
  }, [ourName, deviceType]);

  return (
    <Modal
      isOpen={modalOpen}
      onRequestClose={closeModal}
      contentLabel="Settings Modal"
      style={{
        overlay: {
          background: "#00000070",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        },
        content: {
          inset: "unset",
          backgroundColor: "#00000000",
          border: "none",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        },
      }}
    >
      <div className="flex flex-col justify-center items-center m-2 w-[500px] h-80 rounded-md bg-white dark:bg-neutral-800 text-black dark:text-white">
        <h3 className="font-bold m-1 text-center">Client Options</h3>
        <div className="flex flex-row space-x-16 justify-center m-2">
          <div>
            <div>
              <h3 className="font-bold">Name</h3>
              <input
                value={ourName}
                placeholder="Display name"
                className="w-full rounded-md p-2 m-1 text-black"
                onChange={({ target: { value } }) => setOurName(value)}
              />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center text-center m-2">
            <h3 className="font-bold m-1">Select your device</h3>
            <div className="flex space-x-2">
              <div
                className={`flex rounded-md ${
                  deviceType == "peak"
                    ? "bg-neutral-300 dark:bg-neutral-500"
                    : "bg-neutral-500 dark:bg-neutral-700"
                } pt-2 pb-2 hover:bg-neutral-300 dark:hover:bg-neutral-500 drop-shadow-xl`}
              >
                <img
                  width="96px"
                  src={`/peak/device.png`}
                  onClick={() => setDeviceType("peak")}
                />
              </div>
              <div
                className={`flex rounded-md ${
                  deviceType == "opal"
                    ? "bg-neutral-300 dark:bg-neutral-500"
                    : "bg-neutral-500 dark:bg-neutral-700"
                } pt-2 pb-2 hover:bg-neutral-300 dark:hover:bg-neutral-500 drop-shadow-xl`}
              >
                <img
                  width="96px"
                  src={`/opal/device.png`}
                  onClick={() => setDeviceType("opal")}
                />
              </div>
            </div>
          </div>
        </div>

        <button
          className="w-96 self-center rounded-md bg-indigo-600 hover:bg-indigo-700 p-1 m-1 text-white"
          onClick={() => saveSettings()}
        >
          Save
        </button>
      </div>
    </Modal>
  );
}
