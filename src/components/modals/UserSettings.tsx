import { Dialog, Transition } from "@headlessui/react";
import { useCallback, useState, Fragment } from "react";
import toast from "react-hot-toast";

import { Checkmark } from "../icons/Checkmark";
import { Lock, Unlock } from "../icons/Lock";

export function UserSettingsModal({ modalOpen, setModalOpen }: any) {
  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const [defaultVisibility, setDefaultVisibility] = useState(() =>
    typeof localStorage != "undefined"
      ? localStorage.getItem("puff-default-visbility") || "private"
      : "private"
  );

  const [groupStartOnBatteryCheck, setGroupStartOnBatteryCheck] = useState(() =>
    typeof localStorage != "undefined"
      ? localStorage.getItem("puff-battery-check-start") == "true" || false
      : false
  );

  const saveSettings = useCallback(() => {
    localStorage.setItem("puff-default-visbility", defaultVisibility);
    localStorage.setItem(
      "puff-battery-check-start",
      groupStartOnBatteryCheck.toString()
    );
    toast("Updated user settings", {
      position: "top-right",
    });
    closeModal();
  }, [defaultVisibility, groupStartOnBatteryCheck]);

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
                <p className="font-bold m-1 text-center">Client Options</p>
                <span className="flex justify-between items-center">
                  <p className="font-bold w-64">
                    Start sesh on battery check (3 clicks)
                  </p>
                  <input
                    className="w-6 h-6 rounded-md"
                    type="checkbox"
                    checked={groupStartOnBatteryCheck}
                    onChange={({ target: { checked } }) =>
                      setGroupStartOnBatteryCheck(checked)
                    }
                  />
                </span>
                <hr className="my-2" />
                <p className="font-bold m-1 text-center">Group Defaults</p>
                <span>
                  <p className="font-bold">Visibility</p>
                  <span className="flex flex-row space-x-2 items-center">
                    <span
                      className="p-4 bg-white dark:bg-stone-800 drop-shadow-lg hover:bg-gray-300 dark:hover:bg-stone-900 rounded-md w-full flex flex-row justify-between items-center"
                      onClick={() => setDefaultVisibility("public")}
                    >
                      <span className="flex flex-row items-center">
                        <Unlock className="w-5 mr-2" />
                        <p>Public</p>
                      </span>
                      {defaultVisibility == "public" ? (
                        <Checkmark className="h-5 text-green-600 dark:text-green-500" />
                      ) : (
                        ""
                      )}
                    </span>
                    <span
                      className="p-4 bg-white dark:bg-stone-800 drop-shadow-lg hover:bg-gray-300 dark:hover:bg-stone-900 rounded-md w-full flex flex-row justify-between items-center"
                      onClick={() => setDefaultVisibility("private")}
                    >
                      <span className="flex flex-row items-center">
                        <Lock className="w-5 mr-2" />
                        <p>Private</p>
                      </span>
                      {defaultVisibility == "private" ? (
                        <Checkmark className="h-5 text-green-600 dark:text-green-500" />
                      ) : (
                        ""
                      )}
                    </span>
                  </span>
                </span>

                <button
                  className="w-full self-center rounded-md bg-indigo-600 hover:bg-indigo-700 p-1 mt-3 text-white"
                  onClick={() => saveSettings()}
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
