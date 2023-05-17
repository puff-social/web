import { Dialog, Transition } from "@headlessui/react";
import { useCallback, useState, Fragment } from "react";
import { Op } from "@puff-social/commons";
import toast from "react-hot-toast";

import { gateway } from "../../utils/gateway";

export function GroupStrainModal({ modalOpen, setModalOpen, strain }: any) {
  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const [currentStrain, setCurrentStrain] = useState(() => strain);

  const saveSettings = useCallback(() => {
    gateway.send(Op.GroupStrain, { strain: currentStrain });
    toast("Updated strain for this group", {
      position: "top-right",
    });
    closeModal();
  }, [currentStrain]);

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
                <p className="font-bold m-1 text-center">
                  Group Session Options
                </p>
                <span>
                  <p className="font-bold">Strain Name</p>
                  <input
                    value={currentStrain}
                    placeholder="Strain"
                    maxLength={32}
                    className="w-full rounded-md p-2 mb-2 border-2 border-slate-300 text-black"
                    onChange={({ target: { value } }) =>
                      setCurrentStrain(value)
                    }
                  />
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
