import { Fragment, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Dialog, Transition } from "@headlessui/react";

import {
  selectSessionState,
  setSessionState,
} from "../../state/slices/session";
import { Checkmark } from "../icons/Checkmark";
import { updateUser } from "../../utils/hash";
import toast from "react-hot-toast";

interface Props {
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
}

export function AccountSettingsModal({ modalOpen, setModalOpen }: Props) {
  const session = useSelector(selectSessionState);
  const dispatch = useDispatch();

  const [name] = useState(session.user.name);
  const [display_name, setDisplayName] = useState(session.user.display_name);
  const [location, setLocation] = useState(session.user.location || "");
  const [bio, setBio] = useState(session.user.bio || "");

  const saveSettings = useCallback(async () => {
    await updateUser({
      display_name,
      ...(bio ? { bio } : null),
      ...(location ? { location } : null),
    });
    toast("Updated account", {
      position: "top-right",
      duration: 2000,
      icon: <Checkmark />,
    });
    dispatch(
      setSessionState({
        user: { ...session.user, display_name, bio, location },
      })
    );
  }, [name, display_name, bio, location]);

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
          <div className="fixed inset-0 bg-black/25" />
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
                      <p className="font-bold">Username</p>
                      <p className="font-bold opacity-40">
                        {session.user.name}
                      </p>
                    </span>
                    <span className="flex flex-row justify-between">
                      <p className="font-bold">Account Platform</p>
                      <p className="font-bold opacity-40">
                        {session.connection?.platform.replace(
                          /(\w+)/g,
                          function (x) {
                            return x[0].toUpperCase() + x.substring(1);
                          }
                        )}
                      </p>
                    </span>
                    <span className="flex flex-col space-y-2">
                      <p className="font-bold">Display Name</p>
                      <input
                        className="flex p-2 rounded-md dark:text-black"
                        maxLength={48}
                        value={display_name}
                        onChange={({ target: { value } }) =>
                          setDisplayName(value)
                        }
                      />
                    </span>
                    <span className="flex flex-col space-y-2">
                      <span className="flex items-center justify-between">
                        <p className="font-bold">Location</p>
                        <p className="opacity-50 text-right text-sm">
                          {location.length} / 30
                        </p>
                      </span>
                      <input
                        className="flex p-2 rounded-md dark:text-black"
                        maxLength={30}
                        value={location}
                        onChange={({ target: { value } }) => setLocation(value)}
                      />
                    </span>
                    <span className="flex flex-col space-y-2">
                      <span className="flex items-center justify-between">
                        <p className="font-bold">Bio</p>
                        <p className="opacity-50 text-right text-sm">
                          {bio.length} / 256
                        </p>
                      </span>
                      <textarea
                        className="flex w-full p-2 pb-5 rounded-md dark:text-black"
                        maxLength={256}
                        value={bio || ""}
                        onChange={({ target: { value } }) => setBio(value)}
                      />
                    </span>
                  </span>

                  <hr className="my-2" />

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
