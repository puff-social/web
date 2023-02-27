import Modal from "react-modal";
import { useCallback } from "react";
import { Cross } from "../icons/Cross";

export function InfoModal({ modalOpen, setModalOpen }: any) {
  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  return (
    <Modal
      isOpen={modalOpen}
      onRequestClose={closeModal}
      contentLabel="Info Modal"
      style={{
        overlay: {
          background: "#00000070",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        },
        content: {
          inset: "unset",
          backgroundColor: "#00000000",
          border: "none",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        },
      }}
    >
      <div className="flex flex-col m-2 p-10 rounded-md bg-white dark:bg-neutral-800 text-black dark:text-white justify-center">
        <div className="flex justify-between justify-center items-center pb-5">
          <h1 className="text-xl">Heyo! Welcome to puff.social</h1>

          <Cross
            className="opacity-50 hover:opacity-100 cursor-pointer"
            onClick={() => closeModal()}
          />
        </div>
        <div className="flex flex-row space-x-8">
          <div className="flex flex-col rounded-md space-y-3 justify-center">
            <p className="w-[700px]">
              <span className="font-bold">Important:</span> This should work
              with any device running firmware X or later, and has been
              validated to work with firmware{" "}
              <span className="font-bold text-teal-100 bg-gray-700 px-1 rounded-md">
                Y
              </span>{" "}
              and{" "}
              <span className="font-bold text-teal-100 bg-gray-700 px-1 rounded-md">
                AA
              </span>
            </p>
            <p className="w-[700px]">
              <span className="font-bold">Also Important:</span> This will only
              work on browsers that support the Bluetooth API, so most likely if
              you don't use Google Chrome, you're probably only here to watch.
              (iOS can use the Path Browser, however it's fairly slow and there
              is a better option in the works soon)
            </p>

            <p className="w-[700px]">
              I decided to build this because A friend of mine and I smoke a lot
              over discord, we both have a peak pro, and while not super easy it
              is possible to interact with the device functions over BLE
              initially started by digging through the react native bundle for
              the official web app, and after getting pretty far, I found this{" "}
              <a
                href="https://github.com/Fr0st3h/Puffco-Reverse-Engineering-Writeup"
                className="text-blue-700 dark:text-blue-400"
                target="_blank"
              >
                writeup
              </a>
              , which helped better understand the characteristics and what they
              do, plus all the other obscure things you can do, along with that
              I just love realtime applications, so I built a{" "}
              <a
                className="text-blue-700 dark:text-blue-400"
                target="_blank"
                href="https://github.com/dustinrouillard/puffsocial-gateway"
              >
                socket server
              </a>{" "}
              in elixir to facilitate the synchronization, and threw together a
              rudimentary web app to allow us to sync our dab sessions with
              multiple people.
            </p>

            <p className="w-[700px]">
              After many iterations and plenty of bugs made and then fixed, I'm
              making this ready for anyone to use. You can set your public
              display name in user settings (separate from the device name,
              which is only used on the leaderboards)
            </p>

            <p className="w-[700px]">
              If you encounter any issues, let me know on discord (Dustin#1999
              find me in the server below for dm) or Twitter (
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
              Join my{" "}
              <a
                className="text-blue-700 dark:text-blue-400"
                target="_blank"
                href="https://dstn.to/fnf"
              >
                discord server
              </a>
              , maybe we can sesh sometime :)
            </p>

            <p className="w-[700px] flex flex-col">
              The source for the application and server side code is open, you
              can find the various repositories below.
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
                Analytics Tracking:{" "}
                <a
                  className="text-blue-700 dark:text-blue-400"
                  target="_blank"
                  href="https://github.com/dustinrouillard/puffsocial-analytics"
                >
                  dustinrouillard/puffsocial-analytics
                </a>
              </span>
            </p>

            <p className="w-[700px] italic text-xs p-4">
              If you're reading this and work at Puffco, I just want to give
              cool tools to the community, would love to see a group sesh
              feature in the app (maybe we can chat about that) :)
            </p>
          </div>
          <img
            className="h-96 sm:h-[560px] self-center rounded-md"
            src="/puff.webp"
          />
        </div>
      </div>
    </Modal>
  );
}
