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
              <Dialog.Panel className="w-full max-w-screen-xl transform overflow-hidden rounded-2xl bg-white dark:bg-neutral-800 text-black dark:text-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex flex-col rounded-md space-y-4 justify-center">
                  <p className="text-2xl font-bold">About</p>
                  <p className="w-[700px]">
                    <span className="font-bold">Firmware Note:</span> This
                    should work with any device running firmware X or later, and
                    has been validated to work with firmware{" "}
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
                    <span className="font-bold">Browser Note:</span> This will
                    only work on browsers that support the Bluetooth API, so
                    most likely if you don't use Google Chrome, you're probably
                    only here to watch. (iOS can use the Path Browser, however
                    it's fairly slow and there is a better option in the works
                    soon)
                  </p>

                  <hr className="opacity-20" />

                  <span className="flex flex-row space-x-4">
                    <span className="w-96">
                      <img className="w-fit rounded-md" src="/puff.webp" />
                      <p className="flex text-sm italic opacity-40 break-words flex-wrap">
                        Older design is pictured, updating this graphic soon.
                      </p>
                    </span>
                    <span className="flex flex-col rounded-md space-y-4">
                      <p className="w-[700px]">
                        So I built this because a couple of friends and I would
                        count down starting our puffcos over discord, and after
                        some time we wanted an easier solution. I've dug into
                        applications and recreated logic before so I started
                        digging through the react native web bundles for the
                        puffco app and got familiar with the bluetooth
                        functionality.
                      </p>

                      <p className="w-[700px]">
                        After getting the basic device functions triggering from
                        my code and then working out pulling data from the
                        devices, I put together a realtime socket server in
                        Elixir (I used this as it's a great go-to for realtime
                        concurrency and I'm familiar enough with it to
                        accomplish the task) and then I put together this very
                        react web app (using Next.js, Tailwind, and a few other
                        tools. See the source below for more)
                      </p>

                      <p className="w-[700px]">
                        If you encounter any issues, let us know in the discord
                        below or you can DM me on Twitter (
                        <a
                          className="text-blue-700 dark:text-blue-400"
                          href="https://twitter.com/dustinrouillard"
                          target="_blank"
                        >
                          @dustinrouillard
                        </a>
                        ) or Instagram (
                        <a
                          className="text-blue-700 dark:text-blue-400"
                          href="https://dstn.pics"
                          target="_blank"
                        >
                          @dstn.pics
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
                          Discord
                        </a>{" "}
                        and become apart of our growing community, maybe we can
                        sesh up sometime :)
                      </p>

                      <p className="w-[700px]">
                        Follow our{" "}
                        <a
                          className="text-blue-700 dark:text-blue-400"
                          target="_blank"
                          href="https://discord.gg/M4uYMyU7bC"
                        >
                          Instagram
                        </a>{" "}
                        account, we post on there with updates and news, plus we
                        share the communities posts on our stores, and they're
                        always nice to see.
                      </p>
                    </span>
                  </span>

                  <hr className="opacity-20" />

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
                      API:{" "}
                      <a
                        className="text-blue-700 dark:text-blue-400"
                        target="_blank"
                        href="https://github.com/dustinrouillard/puffsocial-api"
                      >
                        dustinrouillard/puffsocial-api
                      </a>
                    </span>
                    <span>
                      Realtime:{" "}
                      <a
                        className="text-blue-700 dark:text-blue-400"
                        target="_blank"
                        href="https://github.com/dustinrouillard/puffsocial-gateway"
                      >
                        dustinrouillard/puffsocial-gateway
                      </a>
                    </span>
                  </p>

                  <p className="w-[700px] italic text-sm">
                    Shoutout to Puffco for being so awesome and allowing me to
                    run this platform, would love to work together on something
                    in the future. React out if you wanna work together or wanna
                    talk about how this works{" "}
                    <a href="mailto:contact@puff.social">contact@puff.social</a>
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
