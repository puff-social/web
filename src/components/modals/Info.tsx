import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

interface Props {
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
}

export function InfoModal({ modalOpen, setModalOpen }: Props) {
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
              <Dialog.Panel className="w-full max-w-(--breakpoint-xl) transform overflow-hidden rounded-2xl bg-white dark:bg-neutral-800 text-black dark:text-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex flex-col rounded-md space-y-4 justify-center">
                  <p className="text-2xl font-bold">About</p>
                  <span className="flex flex-row space-x-2">
                    <div className="flex flex-col bg-neutral-200 dark:bg-neutral-700 rounded-md p-2">
                      <p className="font-bold">Device Firmware Note:</p>
                      <p>
                        This has been tested to work with any device running
                        firmware{" "}
                        <span className="font-bold text-teal-100 bg-gray-600 px-1 rounded-md">
                          X
                        </span>{" "}
                        or later.
                      </p>
                      <p className="italic text-sm mt-1">
                        Latest firmware seen:{" "}
                        <span className="font-bold text-teal-100 bg-gray-600 px-1 rounded-md">
                          AH
                        </span>
                      </p>
                    </div>
                    <div className="flex flex-col bg-neutral-200 dark:bg-neutral-700 rounded-md p-2">
                      <p className="font-bold">Browser Note:</p>
                      <p>
                        Most browsers don't support the bluetooth API however
                        most Chromium based browsers do, like Chrome, or Edge.
                      </p>
                    </div>
                  </span>

                  <hr className="opacity-20" />

                  <span className="flex flex-row space-x-4">
                    <span className="w-full">
                      <img className="w-96 rounded-md" src="/puff.webp" />
                      <p className="flex text-sm italic opacity-40 wrap-break-word flex-wrap">
                        Older design is pictured, updating this graphic soon.
                      </p>
                    </span>
                    <span className="flex flex-col rounded-md space-y-4">
                      <p>
                        So, a friend and I came up with this idea because we
                        used to gather with homies on Discord to take our dabs,
                        over time, we thought, "There's gotta be a simpler way
                        to do this." and since I have a background in software
                        and have reverse engineered applications before, I
                        decided to dive into the react native web bundles of the
                        puffco app and get to know the Bluetooth magic behind
                        it.
                      </p>

                      <p>
                        After I got the essential device features and data
                        retrieval to work smoothly in a test environment, I set
                        up a real-time socket server to keep everything in sync.
                        That's when I whipped up this pretty basic web app using
                        Next.js, Tailwind, and a bunch of other cool tools (you
                        can check out the source below for the nerdy details).
                      </p>

                      <p>
                        If you ever run into any hiccups, just give us a shout
                        on Discord or slide into my DMs on Instagram (
                        <a
                          className="text-blue-700 dark:text-blue-400"
                          href="https://dstn.pics"
                          target="_blank"
                        >
                          @dstn.pics
                        </a>
                        ).
                      </p>

                      <p>
                        We'd love for you to join our{" "}
                        <a
                          className="text-blue-700 dark:text-blue-400"
                          target="_blank"
                          href="/discord"
                        >
                          Discord gang
                        </a>{" "}
                        and be a part of our growing community. We're in there
                        seshin every day, so feel free to jump in and join the
                        fun with us!
                      </p>

                      <p>
                        You should also follow our{" "}
                        <a
                          className="text-blue-700 dark:text-blue-400"
                          target="_blank"
                          href="/instagram"
                        >
                          Instagram
                        </a>{" "}
                        account, we post on there with updates and news, plus we
                        share the communities posts on our story, and they're
                        always nice to see.
                      </p>
                    </span>
                  </span>

                  <hr className="opacity-20" />

                  <p className="w flex flex-col">
                    The source for the application and server side code is open,
                    you can find the various repositories below.
                    <span className="pt-1 flex flex-col">
                      <span>
                        Web:{" "}
                        <a
                          className="text-blue-700 dark:text-blue-400"
                          target="_blank"
                          href="https://github.com/puff-social/web"
                        >
                          puff-social/web
                        </a>{" "}
                      </span>
                    </span>
                    <span>
                      API:{" "}
                      <a
                        className="text-blue-700 dark:text-blue-400"
                        target="_blank"
                        href="https://github.com/puff-social/api"
                      >
                        puff-social/api
                      </a>
                    </span>
                    <span>
                      Realtime:{" "}
                      <a
                        className="text-blue-700 dark:text-blue-400"
                        target="_blank"
                        href="https://github.com/puff-social/gateway"
                      >
                        puff-social/gateway
                      </a>
                    </span>
                    <span>
                      Commons (Shared Library):{" "}
                      <a
                        className="text-blue-700 dark:text-blue-400"
                        target="_blank"
                        href="https://github.com/puff-social/commons"
                      >
                        puff-social/commons
                      </a>
                    </span>
                    <span>
                      Follow our Github for our other open source repos{" "}
                      <a
                        className="text-blue-700 dark:text-blue-400"
                        target="_blank"
                        href="https://github.com/puff-social"
                      >
                        @puff-social
                      </a>
                    </span>
                  </p>

                  <p className="w italic text-sm">
                    Shoutout to Puffco for being so awesome and allowing me to
                    run this platform, would love to work together on something
                    in the future. Reach out if you wanna work together or talk
                    about how this all works{" "}
                    <a href="mailto:contact@puff.social">contact@puff.social</a>{" "}
                    (Would love to pick someones brain about this new protocol
                    😉)
                  </p>
                </div>
                <button
                  className="bg-blue-500 p-8 rounded-md w-96 mt-8 text-black dark:text-white"
                  onClick={() => setModalOpen(false)}
                >
                  Enter puff.social
                </button>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
