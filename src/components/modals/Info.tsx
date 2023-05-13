import { Dialog, Transition } from "@headlessui/react";
import { useRouter } from "next/router";
import { Fragment, useEffect } from "react";

interface Props {
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
}

export function InfoModal({ modalOpen, setModalOpen }: Props) {
  const router = useRouter();

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
              <Dialog.Panel className="w-full max-w-screen-lg transform overflow-hidden rounded-2xl bg-white dark:bg-neutral-800 text-black dark:text-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex flex-col rounded-md space-y-3 justify-center">
                  <p className="w-[700px]">
                    <span className="font-bold">Important:</span> This should
                    work with any device running firmware X or later, and has
                    been validated to work with firmware{" "}
                    <span className="font-bold text-teal-100 bg-gray-700 px-1 rounded-md">
                      Y
                    </span>
                    ,{" "}
                    <span className="font-bold text-teal-100 bg-gray-700 px-1 rounded-md">
                      Z
                    </span>
                    ,{" "}
                    <span className="font-bold text-teal-100 bg-gray-700 px-1 rounded-md">
                      AA
                    </span>
                    ,{" "}
                    <span className="font-bold text-teal-100 bg-gray-700 px-1 rounded-md">
                      AC
                    </span>{" "}
                    and{" "}
                    <span className="font-bold text-teal-100 bg-gray-700 px-1 rounded-md">
                      AE
                    </span>{" "}
                  </p>
                  <p className="w-[700px]">
                    <span className="font-bold">Also Important:</span> This will
                    only work on browsers that support the Bluetooth API, so
                    most likely if you don't use Google Chrome, you're probably
                    only here to watch. (iOS can use the Path Browser, however
                    it's fairly slow and there is a better option in the works
                    soon)
                  </p>

                  <img className="w-96 rounded-md" src="/puff.webp" />
                  <p className="w-[700px]">
                    I decided to build this because A friend of mine and I smoke
                    a lot over discord, we both have a peak pro, and while not
                    super easy it is possible to interact with the device
                    functions over BLE initially started by digging through the
                    react native bundle for the official web app, besides that I
                    just love realtime applications, so I built a{" "}
                    <a
                      className="text-blue-700 dark:text-blue-400"
                      target="_blank"
                      href="https://github.com/dustinrouillard/puffsocial-gateway"
                    >
                      socket server
                    </a>{" "}
                    in elixir to facilitate the synchronization, and threw
                    together a rudimentary web app to allow us to sync our dab
                    sessions with multiple people.
                  </p>

                  <p className="w-[700px]">
                    After many iterations and plenty of bugs made and then
                    fixed, I'm making this ready for anyone to use. You can set
                    your public display name in user settings (separate from the
                    device name, which is only used on the leaderboards)
                  </p>

                  <p className="w-[700px]">
                    If you encounter any issues, let me know on discord
                    (Dustin#1999 find me in the server below for dm) or Twitter
                    (
                    <a
                      className="text-blue-700 dark:text-blue-400"
                      href="https://twitter.com/dustinrouillard"
                      target="_blank"
                    >
                      @dustinrouillard
                    </a>
                    )
                  </p>

                  <p className="w-[700px]">
                    Join our{" "}
                    <a
                      className="text-blue-700 dark:text-blue-400"
                      target="_blank"
                      href="https://discord.gg/M4uYMyU7bC"
                    >
                      discord server
                    </a>
                    , maybe we can sesh sometime :)
                  </p>

                  <p className="w-[700px] flex flex-col">
                    The source for the application and server side code is open,
                    you can find the various repositories below.
                    <span className="pt-1">
                      Web:{" "}
                      <a
                        className="text-blue-700 dark:text-blue-400"
                        target="_blank"
                        href="https://github.com/dustinrouillard/puffsocial-web"
                      >
                        dustinrouillard/puffsocial-web
                      </a>
                    </span>
                    <span>
                      Realtime Server:{" "}
                      <a
                        className="text-blue-700 dark:text-blue-400"
                        target="_blank"
                        href="https://github.com/dustinrouillard/puffsocial-gateway"
                      >
                        dustinrouillard/puffsocial-gateway
                      </a>
                    </span>
                    <span>
                      API:{" "}
                      <a
                        className="text-blue-700 dark:text-blue-400"
                        target="_blank"
                        href="https://github.com/dustinrouillard/puffsocial-api"
                      >
                        dustinrouillard/puffsocial-api
                      </a>
                    </span>
                  </p>

                  <p className="w-[700px] italic text-sm">
                    If you're reading this and work at Puffco, I just want to
                    give cool tools to the community, would love to see a group
                    sesh feature in the app (maybe we can chat about that) :) --
                    If you have an issue with this or want me to change
                    anything, reach out to me (contact@puff.social)
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
