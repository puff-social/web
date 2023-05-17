import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import toast from "react-hot-toast";
import { useCallback, useState } from "react";

import { gateway } from "../../utils/gateway";
import { Checkmark } from "../icons/Checkmark";
import { GatewayGroup } from "../../types/gateway";
import { useRouter } from "next/router";
import { Lock, Unlock } from "../icons/Lock";
import { Op } from "@puff-social/commons";

export interface ModalProps {
  modalOpen: boolean;
  setModalOpen: Function;
  group: GatewayGroup;
}

export function GroupSettingsModal({
  modalOpen,
  setModalOpen,
  group,
}: ModalProps) {
  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);
  const router = useRouter();

  const [groupName, setGroupName] = useState<string>(group.name);
  const [groupVisibility, setGroupVisibility] = useState<string>(
    group.visibility
  );

  const saveSettings = useCallback(() => {
    gateway.send(Op.UpdateGroup, {
      name: groupName,
      visibility: groupVisibility,
    });
    toast("Updated group", { position: "top-right", duration: 3000 });
    closeModal();
  }, [groupName, groupVisibility]);

  const deleteGroup = useCallback(() => {
    gateway.send(Op.DeleteGroup);
    toast("Group deleted", {
      position: "top-right",
      duration: 3000,
      icon: "🗑",
    });
  }, [group]);

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
                <p className="font-bold m-1 text-center">Edit Group</p>
                <span>
                  <p className="font-bold">Name</p>
                  <input
                    value={groupName}
                    placeholder="Group name"
                    maxLength={32}
                    className="w-full rounded-md p-2 mb-2 border-2 border-slate-300 text-black"
                    onChange={({ target: { value } }) => setGroupName(value)}
                  />
                </span>
                <span>
                  <p className="font-bold">Group Visibility</p>
                  <span className="flex flex-row space-x-2 items-center">
                    <span
                      className="p-4 bg-white dark:bg-stone-800 drop-shadow-lg hover:bg-gray-300 dark:hover:bg-stone-900 rounded-md w-full flex flex-row justify-between items-center"
                      onClick={() => setGroupVisibility("public")}
                    >
                      <span className="flex flex-row items-center">
                        <Unlock className="w-5 mr-2" />
                        <p>Public</p>
                      </span>
                      {groupVisibility == "public" ? (
                        <Checkmark className="h-5 text-green-600 dark:text-green-500" />
                      ) : (
                        ""
                      )}
                    </span>
                    <span
                      className="p-4 bg-white dark:bg-stone-800 drop-shadow-lg hover:bg-gray-300 dark:hover:bg-stone-900 rounded-md w-full flex flex-row justify-between items-center"
                      onClick={() => setGroupVisibility("private")}
                    >
                      <span className="flex flex-row items-center">
                        <Lock className="w-5 mr-2" />
                        <p>Private</p>
                      </span>
                      {groupVisibility == "private" ? (
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
                <hr className="mt-3 border-neutral-500/30 rounded-md" />
                <button
                  className="w-full self-center rounded-md bg-red-500 hover:bg-red-600 p-1 mt-3 text-white"
                  onClick={() => deleteGroup()}
                >
                  Delete Group
                </button>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
