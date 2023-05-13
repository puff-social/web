import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useCallback, useState } from "react";
import { toast } from "react-hot-toast";

import { Cross } from "../icons/Cross";
import { sendFeedback } from "../../utils/hash";

export function FeedbackModal({ modalOpen, setModalOpen }: any) {
  const [message, setMessage] = useState<string>("");

  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const send = useCallback(() => {
    sendFeedback(message);
    setMessage("");
    toast("Feedback sent", {
      icon: "✅",
      duration: 2000,
      position: "top-right",
    });
    closeModal();
  }, [message]);

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
              <Dialog.Panel className="w-full max-w-2xl space-y-3 transform overflow-hidden rounded-2xl bg-white dark:bg-neutral-800 text-black dark:text-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center">
                  <h1 className="text-xl">Send Feedback</h1>

                  <Cross
                    className="opacity-50 hover:opacity-100"
                    onClick={() => closeModal()}
                  />
                </div>

                <p className="w-[500px] pb-4">
                  Hey we're not perfect, if you have a suggestion or found a
                  problem, let us know about it!
                </p>

                <span className="flex flex-col">
                  <textarea
                    className="p-4 border-2 border-slate-400 rounded-md text-black"
                    placeholder="Type a message..."
                    maxLength={1024}
                    rows={4}
                    value={message}
                    onChange={({ target: { value } }) => {
                      if (value.length <= 1024) setMessage(value);
                    }}
                    onKeyDown={(event) => {
                      if (event.code == "Enter" && event.shiftKey) send();
                    }}
                  />
                  <p className="opacity-50 pt-1 self-end">
                    {message.length.toLocaleString()} / 1,024
                  </p>
                  <button
                    className="w-32 self-end rounded-md bg-indigo-600 hover:bg-indigo-700 p-1 mt-4 text-white"
                    onClick={() => send()}
                  >
                    Send
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
