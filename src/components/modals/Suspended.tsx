import { Fragment } from "react";
import { useSelector } from "react-redux";
import { Dialog, Transition } from "@headlessui/react";

import { selectSessionState } from "../../state/slices/session";

export function SuspendedModal() {
  const session = useSelector(selectSessionState);

  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={() => {}}>
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-neutral-800 text-black dark:text-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex flex-col rounded-md space-y-4 justify-center">
                  <p className="text-2xl font-bold">User Suspended!</p>
                  <p>
                    It seems the account you're logged into is suspended, this
                    could be for a number of reasons. If you believe this is a
                    mistake send an email to{" "}
                    <span
                      className="cursor-pointer bg-neutral-700 w-fit rounded-md px-1 underline"
                      onClick={() =>
                        window.open(
                          `mailto:suspensions@puff.social?subject=Appealing suspension for ${session?.user.id}`
                        )
                      }
                    >
                      suspensions@puff.social
                    </span>{" "}
                    and be sure to include the ID from below in the subject.
                    <span className="pl-1 italic opacity-60">
                      (clicking the email does this in your mail client)
                    </span>
                  </p>

                  <div className="flex flex-col opacity-60">
                    <p>ID: {session?.user.id}</p>
                    <p>Username: {session?.user.name}</p>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
