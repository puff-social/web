import Modal from "react-modal";
import toast from "react-hot-toast";
import { useCallback, useState } from "react";
import usePrefersColorScheme from "use-prefers-color-scheme";

import { gateway, Op } from "../../utils/gateway";
import { PuffcoContainer } from "../puffco";
import { PuffcoOperatingState } from "../../types/gateway";
import { ChargeSource } from "../../utils/puffco";

export function SettingsModal({ modalOpen, setModalOpen }: any) {
  const prefersColorScheme = usePrefersColorScheme();

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
      <div className="flex flex-col justify-center items-center m-2 p-4 rounded-md bg-white dark:bg-neutral-800 text-black dark:text-white">
        <h3 className="font-bold m-1 text-center">Client Options</h3>
        <div className="flex flex-row space-x-16 justify-center m-2">
          <div>
            <div>
              <h3 className="font-bold">Name</h3>
              <input
                value={ourName}
                placeholder="Display name"
                maxLength={32}
                className="w-full rounded-md p-2 m-1 border-2 border-slate-300 text-black"
                onChange={({ target: { value } }) => setOurName(value)}
              />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center text-center m-2">
            <h3 className="font-bold m-1">Select your device</h3>
            <div className="flex space-x-4">
              <div
                className={`flex rounded-md bg-neutral-100 dark:bg-neutral-700 pt-2 pb-2 hover:bg-neutral-200 dark:hover:bg-neutral-600 drop-shadow-xl w-32 h-64 self-center flex`}
                onClick={() => setDeviceType("peak")}
              >
                <PuffcoContainer
                  model="peak"
                  id="peak"
                  className="flex items-center justify-center self-center w-full"
                  demo={{
                    activeColor: {
                      r: deviceType == "peak" ? 32 : 0,
                      g: 0,
                      b: deviceType == "peak" ? 23 : 0,
                    },
                    state: PuffcoOperatingState.IDLE,
                    chargeSource: ChargeSource.None,
                  }}
                />
              </div>
              <div
                className={`flex rounded-md bg-neutral-100 dark:bg-neutral-700 pt-2 pb-2 hover:bg-neutral-200 dark:hover:bg-neutral-600 drop-shadow-xl w-32 h-64 self-center flex`}
                onClick={() => setDeviceType("opal")}
              >
                <PuffcoContainer
                  model="opal"
                  id="opal"
                  className="flex items-center justify-center self-center w-full"
                  demo={{
                    activeColor: {
                      r: 0,
                      g: deviceType == "opal" ? 32 : 0,
                      b: deviceType == "opal" ? 64 : 0,
                    },
                    state: PuffcoOperatingState.IDLE,
                    chargeSource: ChargeSource.None,
                  }}
                />
              </div>
              <div
                className={`flex rounded-md bg-neutral-100 dark:bg-neutral-700 pt-2 pb-2 hover:bg-neutral-200 dark:hover:bg-neutral-600 drop-shadow-xl w-32 h-64 self-center flex`}
                onClick={() => setDeviceType("indiglow")}
              >
                <PuffcoContainer
                  model="indiglow"
                  id="indiglow"
                  className="flex items-center justify-center self-center w-full"
                  demo={{
                    activeColor: {
                      r: 0,
                      g: 0,
                      b: deviceType == "indiglow" ? 255 : 0,
                    },
                    state: PuffcoOperatingState.IDLE,
                    chargeSource: ChargeSource.None,
                  }}
                />
              </div>
              <div
                className={`flex rounded-md bg-neutral-100 dark:bg-neutral-700 pt-2 pb-2 hover:bg-neutral-200 dark:hover:bg-neutral-600 drop-shadow-xl w-32 h-64 self-center flex`}
                onClick={() => setDeviceType("guardian")}
              >
                <PuffcoContainer
                  model="guardian"
                  id="guardian"
                  className="flex items-center justify-center self-center w-full"
                  demo={{
                    activeColor: {
                      r: 0,
                      g: deviceType == "guardian" ? 64 : 0,
                      b: deviceType == "guardian" ? 255 : 0,
                    },
                    state: PuffcoOperatingState.IDLE,
                    chargeSource: ChargeSource.None,
                  }}
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
