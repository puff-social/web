import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";

interface Props {}

export function KevoModal() {
  const [modalOpen, setModalOpen] = useState(true);

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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-neutral-800 text-black dark:text-white p-6 text-left align-middle shadow-xl transition-all space-y-3">
                <img
                  src="https://cdn.puff.social/kevo.png"
                  className="rounded-md"
                />

                <p className="italic">
                  Not endorsed nor created by Puffco, just a funny little meme
                  brought to you by puff.social :)
                </p>

                <p className="italic">
                  Shoutout to{" "}
                  <a
                    className="text-blue-700 dark:text-blue-400"
                    href="https://instagram.com/kevin_puffco"
                    target="_blank"
                  >
                    Kevin
                  </a>{" "}
                  for being an absolute legend, he's the main guy in the team
                  that makes events happen at Puffco, huge part of the reason
                  Puffcon is so enjoyable!
                </p>

                <div className="w-full mt-8 flex justify-center">
                  <button
                    className="bg-blue-500 p-2 rounded-md w-32 text-black dark:text-white"
                    onClick={() => setModalOpen(false)}
                  >
                    Close
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
