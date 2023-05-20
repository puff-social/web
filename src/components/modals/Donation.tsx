import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

interface Props {
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
}

export function DonationModal({ modalOpen, setModalOpen }: Props) {
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
                <div className="flex flex-col rounded-md space-y-4 justify-center">
                  <p className="text-2xl font-bold">Support the Project</p>

                  <span className="flex flex-col space-y-4">
                    <span className="flex flex-col rounded-md space-y-4">
                      <p>
                        Hey there, a lot of work goes into keeping this site
                        running, even more went into building it.
                      </p>
                      <p>
                        If you're enjoying the platform and feel like supporting
                        future development, buying licenses and actual hosting,
                        we have a couple ways to support.
                      </p>
                    </span>
                  </span>
                </div>
                <span className="flex flex-col mt-4 space-y-2">
                  <button
                    className="bg-neutral-500 p-4 rounded-md w-full text-black dark:text-white"
                    onClick={() => window.open("https://dstn.to/sponsor")}
                  >
                    Sponsor on Github
                  </button>
                  <button
                    className="bg-[#7289DA] p-4 rounded-md w-full text-black dark:text-white"
                    onClick={() => window.open("/support")}
                  >
                    Subscribe on Discord
                  </button>
                </span>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
