import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { formatRelativeTimeInDays } from "../../utils/time";

interface Props {
  from: string;
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
}

const EXPIRY_DATE_EPOCH = 1738627200000;

export function DonationModal({ modalOpen, setModalOpen, from }: Props) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const expiry = useMemo(() => {
    return formatRelativeTimeInDays(currentDate, new Date(EXPIRY_DATE_EPOCH));
  }, [currentDate]);

  useEffect(() => {
    const int = setInterval(() => setCurrentDate(new Date()), 60_000);
    return () => clearInterval(int);
  }, []);

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
                      {from == "renewal_cta" ? (
                        <>
                          <p>
                            Our domain{" "}
                            <span className="px-1 bg-neutral-300 dark:bg-neutral-600 rounded-md">
                              puff.social
                            </span>{" "}
                            is due for renewal on{" "}
                            <span className="px-1 bg-neutral-300 dark:bg-neutral-600 rounded-md">
                              February 4th, 2025
                            </span>
                            <span className="px-1 bg-neutral-300 dark:bg-neutral-600 rounded-md ml-2">
                              ({expiry})
                            </span>
                          </p>
                          <p>
                            If you wanna see us stick around, we'd love to have
                            your support.
                          </p>
                        </>
                      ) : (
                        <>
                          <p>
                            Hey there, a lot of work goes into keeping this site
                            running, even more went into building it.
                          </p>
                          <p>
                            If you're enjoying the platform and feel like
                            supporting future development, buying licenses and
                            actual hosting, we have a couple ways to support.
                          </p>
                        </>
                      )}
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
                    className="bg-[#f96854] p-4 rounded-md w-full text-black dark:text-white"
                    onClick={() => window.open("/patreon")}
                  >
                    Subscribe on Patreon
                  </button>
                  <p className="text-sm italic opacity-75">
                    We don't mind if you only subscribe for one month to offer a
                    one-time contribution
                  </p>
                </span>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
