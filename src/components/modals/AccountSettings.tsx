import { Fragment, useCallback, useState } from "react";
import { useSelector } from "react-redux";
import { Dialog, Transition } from "@headlessui/react";

import { selectSessionState } from "../../state/slices/session";
import { NameDisplay } from "../../utils/constants";
import { Checkmark } from "../icons/Checkmark";
import { updateUser } from "../../utils/hash";
import toast from "react-hot-toast";
import { Tippy } from "../Tippy";

interface Props {
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
}

export function AccountSettingsModal({ modalOpen, setModalOpen }: Props) {
  const session = useSelector(selectSessionState);

  const [nameDisplayMode, setNameDisplayMode] = useState(
    session.user.name_display
  );

  const saveSettings = useCallback(async () => {
    await updateUser({ name_display: nameDisplayMode });
    toast("Updated account", {
      position: "top-right",
      duration: 2000,
      icon: <Checkmark />,
    });
  }, [nameDisplayMode]);

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
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-neutral-800 text-black dark:text-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h1"
                  className="text-lg text-center font-bold leading-6 text-black dark:text-white"
                >
                  Account Settings
                </Dialog.Title>

                <div className="mt-2">
                  <span className="flex flex-col space-y-2">
                    <span className="flex flex-row justify-between">
                      <p className="font-bold">Display Name</p>
                      <p className="font-bold opacity-40">
                        {nameDisplayMode == NameDisplay.FirstName
                          ? session.user.first_name
                          : nameDisplayMode == NameDisplay.FirstLast
                          ? `${session.user.first_name} ${session.user.last_name}`
                          : session.user.name}
                      </p>
                    </span>

                    <span className="flex flex-row justify-between">
                      <p className="font-bold">Account Platform</p>
                      <p className="font-bold opacity-40">
                        {session.user.platform.replace(/(\w+)/g, function (x) {
                          return x[0].toUpperCase() + x.substring(1);
                        })}
                      </p>
                    </span>
                  </span>

                  <hr className="my-2" />

                  <Tippy
                    content="Disabled unless logged in with a puffco account"
                    disabled={session.user.platform == "puffco"}
                    placement="bottom"
                    followCursor
                    arrow
                  >
                    <span
                      className={`flex flex-col space-y-2 justify-between ${
                        session.user?.platform != "puffco"
                          ? "brightness-50"
                          : ""
                      }`}
                    >
                      <p className="font-bold w-full">Display Name Behaviour</p>

                      <span className="flex flex-row space-x-2 items-center">
                        <span
                          className={`p-4 bg-white dark:bg-stone-800 drop-shadow-lg ${
                            session.user?.platform == "puffco"
                              ? "hover:bg-gray-300 dark:hover:bg-stone-900"
                              : ""
                          } rounded-md w-full flex flex-row justify-between items-center`}
                          onClick={() =>
                            session.user?.platform == "puffco"
                              ? setNameDisplayMode(NameDisplay.Default)
                              : false
                          }
                        >
                          <span className="flex flex-row items-center">
                            <p>Default</p>
                          </span>
                          {nameDisplayMode == NameDisplay.Default ? (
                            <Checkmark className="h-5 text-green-600 dark:text-green-500" />
                          ) : (
                            <></>
                          )}
                        </span>
                      </span>

                      <span className="flex flex-row space-x-2 items-center">
                        <span
                          className={`p-4 bg-white dark:bg-stone-800 drop-shadow-lg ${
                            session.user?.platform == "puffco"
                              ? "hover:bg-gray-300 dark:hover:bg-stone-900"
                              : ""
                          } rounded-md w-full flex flex-row justify-between items-center`}
                          onClick={() =>
                            session.user?.platform == "puffco"
                              ? setNameDisplayMode(NameDisplay.FirstName)
                              : false
                          }
                        >
                          <span className="flex flex-row items-center">
                            <p>First Name</p>
                          </span>
                          {nameDisplayMode == NameDisplay.FirstName ? (
                            <Checkmark className="h-5 text-green-600 dark:text-green-500" />
                          ) : (
                            <></>
                          )}
                        </span>
                        <span
                          className={`p-4 bg-white dark:bg-stone-800 drop-shadow-lg ${
                            session.user?.platform == "puffco"
                              ? "hover:bg-gray-300 dark:hover:bg-stone-900"
                              : ""
                          } rounded-md w-full flex flex-row justify-between items-center`}
                          onClick={() =>
                            session.user?.platform == "puffco"
                              ? setNameDisplayMode(NameDisplay.FirstLast)
                              : false
                          }
                        >
                          <span className="flex flex-row items-center">
                            <p>First/Last</p>
                          </span>
                          {nameDisplayMode == NameDisplay.FirstLast ? (
                            <Checkmark className="h-5 text-green-600 dark:text-green-500" />
                          ) : (
                            <></>
                          )}
                        </span>
                      </span>
                    </span>
                  </Tippy>

                  <button
                    className="w-full self-center rounded-md bg-indigo-600 hover:bg-indigo-700 p-2 mt-3 text-white"
                    onClick={() => saveSettings()}
                  >
                    Save
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
