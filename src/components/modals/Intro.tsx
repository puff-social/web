import { Dialog, Transition } from "@headlessui/react";
import Link from "next/link";
import { Fragment, useState } from "react";
import toast from "react-hot-toast";
import { ChevronLeft } from "../icons/Chevron";

export function IntroModal() {
  const [step, setStep] = useState(0);
  const [modalOpen, setModalOpen] = useState(true);

  return (
    <Transition appear show={modalOpen} as={Fragment}>
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
              {step == 0 ? (
                <Dialog.Panel className="w-full md:max-w-2xl max-w-screen-xl transform overflow-hidden rounded-2xl bg-white dark:bg-neutral-800 text-black dark:text-white p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex flex-col rounded-md space-y-4 justify-center items-center relative">
                    <p className="text-2xl font-bold">Welcome to puff.social</p>

                    <p className="text-center max-w-xl">
                      Welcome to the virtual dab lounge, if you'd like to learn
                      about what you can do here and how to do it head on
                      through our onboarding, if you're familar already or wanna
                      go at it blind there's also a skip button below.
                    </p>

                    <button
                      className="bg-blue-500 p-4 rounded-md w-48 mt-8 text-black dark:text-white"
                      onClick={() => setStep((s) => s + 1)}
                    >
                      Next
                    </button>
                    <p
                      className="italic text-sm hover:underline cursor-pointer opacity-70"
                      onClick={() => setModalOpen(false)}
                    >
                      Skip intro
                    </p>
                  </div>
                </Dialog.Panel>
              ) : step == 1 ? (
                <Dialog.Panel className="w-full md:max-w-2xl max-w-screen-xl transform overflow-hidden rounded-2xl bg-white dark:bg-neutral-800 text-black dark:text-white p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex flex-col rounded-md space-y-4 justify-center items-center relative">
                    <span
                      className="absolute top-4 left-4 hover:brightness-75 cursor-pointer"
                      onClick={() => setStep((s) => s - 1)}
                    >
                      <ChevronLeft />
                    </span>
                    <p className="text-2xl font-bold">What is puff.social</p>

                    <div className="flex flex-col justify-center items-center space-y-4">
                      <p className="text-center max-w-xl">
                        In short, we're a social dabbing community but we stem
                        from our original purpose which is synchronizing Puffco
                        Peak Pro devices over the internet to dab at the same
                        time as your friends.
                      </p>

                      <p className="text-center max-w-xl">
                        It quickly became a community outside of just Puffco and
                        the website, but our roots are still here and will
                        always be our main focus.
                      </p>

                      <p className="text-center max-w-xl">
                        If you want to read more about how puff.social came
                        about and see the source and all that fancy stuff see
                        the{" "}
                        <span className="text-blue-500 cursor-pointer hover:underline">
                          <Link href={"/info"} target="_blank">
                            info page
                          </Link>
                        </span>
                      </p>
                    </div>

                    <button
                      className="bg-blue-500 p-4 rounded-md w-48 mt-8 text-black dark:text-white"
                      onClick={() => setStep((s) => s + 1)}
                    >
                      Next
                    </button>
                  </div>
                </Dialog.Panel>
              ) : step == 2 ? (
                <Dialog.Panel className="w-full md:max-w-2xl max-w-screen-xl transform overflow-hidden rounded-2xl bg-white dark:bg-neutral-800 text-black dark:text-white p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex flex-col rounded-md space-y-4 justify-center items-center relative">
                    <span
                      className="absolute top-4 left-4 hover:brightness-75 cursor-pointer"
                      onClick={() => setStep((s) => s - 1)}
                    >
                      <ChevronLeft />
                    </span>
                    <p className="text-2xl font-bold">
                      Logging in with an account
                    </p>

                    <div className="flex flex-col justify-center items-center space-y-4">
                      <p className="text-center max-w-xl">
                        We have a device and user leaderboard to showcase the
                        highest dab counts, we gate this behind logging into an
                        account to perseve the quality of the leaderboards, we
                        have a few login options, click the login in the site
                        header after you're finished with the intro.
                      </p>
                      <p className="text-center max-w-xl">
                        The site is also usable without an account, you just
                        won't have a leaderboard position and you may not get
                        some features in the future.
                      </p>
                    </div>

                    <button
                      className="bg-blue-500 p-4 rounded-md w-48 mt-8 text-black dark:text-white"
                      onClick={() => setStep((s) => s + 1)}
                    >
                      Next
                    </button>
                  </div>
                </Dialog.Panel>
              ) : step == 3 ? (
                <Dialog.Panel className="w-full md:max-w-2xl max-w-screen-xl transform overflow-hidden rounded-2xl bg-white dark:bg-neutral-800 text-black dark:text-white p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex flex-col rounded-md space-y-4 justify-center items-center relative">
                    <span
                      className="absolute top-4 left-4 hover:brightness-75 cursor-pointer"
                      onClick={() => setStep((s) => s - 1)}
                    >
                      <ChevronLeft />
                    </span>
                    <p className="text-2xl font-bold">Connecting your device</p>

                    <div className="flex flex-col justify-center items-center space-y-4">
                      <p className="text-center max-w-xl">
                        If you're using a Windows computer you just head on over
                        to your bluetooth settings and pair the device (Make
                        sure you put the Peak in pairing mode by holding the
                        button till it starts the blue ring)
                        <br />
                        <span className="italic text-sm">
                          If you're using Windows 11, you will have to make sure
                          the "Device Discovery" option is set to "Advanced" at
                          the bottom of your bluetooth settings.
                        </span>
                      </p>
                      <p className="text-center max-w-xl">
                        If you're using a Mac you can skip the bluetooth
                        settings part and just connect from the browser and your
                        mac will prompt you that the device wants to pair.
                      </p>
                      <p className="text-center max-w-xl italic">
                        If you're on mobile, some have had success on Androids
                        however we're aware the site doesn't function in the
                        path browser on the iOS side, and that's not worth
                        fixing due to the path browser full screening the puffco
                        app experience for most users, we have plans for
                        bringing puff.social to mobile users, and we hope to
                        enact them super soon.
                      </p>
                    </div>

                    <button
                      className="bg-blue-500 p-4 rounded-md w-48 mt-8 text-black dark:text-white"
                      onClick={() => setStep((s) => s + 1)}
                    >
                      Next
                    </button>
                  </div>
                </Dialog.Panel>
              ) : step == 4 ? (
                <Dialog.Panel className="w-full md:max-w-2xl max-w-screen-xl transform overflow-hidden rounded-2xl bg-white dark:bg-neutral-800 text-black dark:text-white p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex flex-col rounded-md space-y-4 justify-center items-center relative">
                    <span
                      className="absolute top-4 left-4 hover:brightness-75 cursor-pointer"
                      onClick={() => setStep((s) => s - 1)}
                    >
                      <ChevronLeft />
                    </span>
                    <p className="text-2xl font-bold">We hope you enjoy!</p>

                    <div className="flex flex-col justify-center items-center space-y-4">
                      <p className="text-center max-w-xl">
                        We hope you have a good time here, with good friends and
                        good dabs.
                      </p>
                      <p className="text-center max-w-xl">
                        If you ever need anything or have any issues don't
                        hesitate to reach out through our{" "}
                        <a
                          className="text-blue-700 dark:text-blue-400"
                          target="_blank"
                          href="/discord"
                        >
                          discord
                        </a>
                        !
                      </p>
                    </div>

                    <button
                      className="bg-blue-500 p-4 rounded-md w-64 mt-8 text-black dark:text-white"
                      onClick={() => setModalOpen(false)}
                    >
                      Enter puff.social
                    </button>
                  </div>
                </Dialog.Panel>
              ) : (
                <></>
              )}
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
