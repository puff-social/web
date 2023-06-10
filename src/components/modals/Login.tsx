import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useCallback, useEffect, useState } from "react";

import { Discord } from "../icons/Discord";
import { PuffcoLogo } from "../icons/Puffco";
import {
  callbackDiscordOAuth,
  getDiscordOAuth,
  loginWithPuffco,
} from "../../utils/hash";
import toast from "react-hot-toast";
import { setSessionState } from "../../state/slices/session";
import { gateway } from "../../utils/gateway";
import { useDispatch } from "react-redux";
import { ChevronLeft } from "../icons/ChevronLeft";
import { Op, UserFlags } from "@puff-social/commons";

interface Props {
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
}

function LoginMode({
  mode,
  setMode,
  submitting,
  setSubmitting,
  closeModal,
}: {
  mode: string;
  setMode: (val: string) => void;
  submitting: boolean;
  setSubmitting: (val: boolean) => void;
  closeModal: () => void;
}) {
  const dispatch = useDispatch();

  const [email, setEmail] = useState<string>();
  const [password, setPassword] = useState<string>();

  const [loginErrors, setLoginErrors] = useState<string[]>([]);

  const puffcoLogin = useCallback(async () => {
    try {
      const login = await loginWithPuffco(email, password);

      localStorage.setItem("puff-social-auth", login.data.token);
      toast("Logged in", {
        position: "top-right",
        duration: 2000,
        icon: <PuffcoLogo />,
      });

      closeModal();

      if (localStorage.getItem("puff-social-auth"))
        gateway.send(Op.LinkUser, {
          token: login.data.token,
        });

      dispatch(
        setSessionState({
          user: login.data.user,
          connection: login.data.connection,
          suspended: login.data.user.flags & UserFlags.suspended,
        })
      );

      if (login.data.user.flags & UserFlags.suspended) {
        toast("User suspended", {
          position: "top-right",
          duration: 5000,
          icon: "❌",
        });
      }

      setLoginErrors([]);
      setSubmitting(false);
    } catch (error) {
      if ("code" in error && error.code == "invalid_auth") {
        if (error.data.code == "invalid_login_request") {
          setLoginErrors(error.data.message);
          setSubmitting(false);
        } else if (error.data.code === "invalid_login_credentials") {
          const remaining = error.data.remaining;
          setLoginErrors([`Invalid password (${remaining} attempts left)`]);
          setSubmitting(false);
        } else if (error.data.code === "login_max_retries") {
          setLoginErrors([
            `Max failed attempts, try again in ${error.data.time} minutes`,
          ]);
          setSubmitting(false);
        }
      }
    }
  }, [email, password]);

  switch (mode) {
    case "initial": {
      return (
        <>
          <Dialog.Title
            as="h1"
            className="text-lg text-center font-bold leading-6 text-black dark:text-white"
          >
            Login
          </Dialog.Title>

          <div className="mt-2">
            Login to get on the leaderboards track device statistics and more.
          </div>

          <div className="mt-8 space-y-2 text-black dark:text-white">
            <button
              className="flex w-full justify-center align-center rounded-md p-2 bg-white dark:bg-neutral-800 drop-shadow-xl"
              onClick={() => setMode("discord")}
            >
              <Discord className="mr-2" />
              Discord
            </button>
            <button
              className="flex font-bold w-full justify-center align-center rounded-md p-2 bg-white dark:bg-neutral-800 drop-shadow-xl"
              onClick={() => setMode("puffco")}
            >
              <PuffcoLogo className="mr-2" />
              PUFFCO Account
            </button>
          </div>
        </>
      );
    }

    case "discord": {
      return (
        <>
          <Dialog.Title
            as="h1"
            className="text-lg text-center font-bold leading-6 text-black dark:text-white"
          >
            Discord Login
          </Dialog.Title>

          <div className="mt-2 text-center">
            Continue in the popup to login with discord
          </div>

          <div className="flex justify-center items-center mt-4">
            <Discord height="auto" width={64} className="mr-1" />{" "}
            <p className="mx-6 text-2xl font-bold cursor-default select-none">
              +
            </p>{" "}
            <img height="auto" width={64} src="/pixel-peak.png" />
          </div>
        </>
      );
    }

    case "puffco": {
      return (
        <>
          <div
            className="flex space-x-2 items-center brightness-50 hover:brightness-100 transition-all cursor-pointer"
            onClick={() => setMode("initial")}
          >
            <ChevronLeft /> Back
          </div>
          <Dialog.Title
            as="h1"
            className="text-lg text-center font-bold leading-6 text-black dark:text-white"
          >
            PUFFCO Account
          </Dialog.Title>

          <div className="mt-2">
            Login with an existing puffco account, if you don't have one use the
            puffco connect app to make one.
          </div>

          <form
            onSubmit={(e) => {
              setSubmitting(true);
              e.preventDefault();
              puffcoLogin();
            }}
          >
            <div className="flex flex-col justify-center items-center space-y-2 w-full mt-2">
              <span className="w-full">
                <p>Email</p>
                <input
                  className="w-full p-2 border-2 border-slate-400 rounded-md text-black"
                  value={email}
                  disabled={submitting}
                  onChange={({ target: { value } }) => setEmail(value)}
                />
              </span>

              <span className="w-full">
                <p>Password</p>
                <input
                  className="w-full p-2 border-2 border-slate-400 rounded-md text-black"
                  type="password"
                  value={password}
                  disabled={submitting}
                  onChange={({ target: { value } }) => setPassword(value)}
                />
              </span>
            </div>

            <div className="w-full mt-4">
              <button
                disabled={submitting}
                className={`flex justify-center items-center p-2 bg-blue-500 hover:bg-blue-400 rounded-md w-full ${
                  submitting ? "brightness-50" : ""
                }`}
              >
                Login
              </button>
              {loginErrors.length > 0 ? (
                <>
                  {loginErrors.map((error, index) => (
                    <p key={index} className="italic text-red-500">
                      {error}
                    </p>
                  ))}
                </>
              ) : (
                <></>
              )}
            </div>
          </form>

          <p className="mt-4 italic opacity-40">
            We do not store your credentials, they're only sent to the Puffco
            API to return the details of your user.
          </p>
        </>
      );
    }
  }
}

export function LoginModal({ modalOpen, setModalOpen }: Props) {
  const [loginMode, setLoginMode] = useState("initial");
  const [submitting, setSubmitting] = useState(false);

  const dispatch = useDispatch();

  const startDiscordOAuth = useCallback(async () => {
    const oauth = await getDiscordOAuth();
    const child = window.open(
      oauth.data.url,
      "Login with Discord",
      "width=1000,height=820"
    );

    const int = setInterval(async () => {
      try {
        const search = new URLSearchParams(child.location.search);

        if (child.closed) {
          toast("Login canceled", {
            position: "top-right",
            duration: 2000,
            icon: "❌",
          });
          clearInterval(int);
          setLoginMode("initial");
        }

        if (search.get("code")) {
          const authed = await callbackDiscordOAuth(
            search.get("code"),
            search.get("state")
          );

          localStorage.setItem("puff-social-auth", authed.data.token);
          toast("Logged in", {
            position: "top-right",
            duration: 2000,
            icon: <Discord />,
          });

          setModalOpen(false);

          if (localStorage.getItem("puff-social-auth"))
            gateway.send(Op.LinkUser, {
              token: authed.data.token,
            });

          dispatch(
            setSessionState({
              user: authed.data.user,
              connection: authed.data.connection,
            })
          );

          clearInterval(int);
          if (!child.closed) child.close();
        }
      } catch (error) {}
    }, 500);
  }, []);

  useEffect(() => {
    if (loginMode == "discord") {
      startDiscordOAuth();
    }
  }, [loginMode]);

  useEffect(() => {
    if (modalOpen) setLoginMode("initial");
  }, [modalOpen]);

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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-neutral-800 text-black dark:text-white p-6 text-left align-middle shadow-xl transition-all">
                <LoginMode
                  submitting={submitting}
                  setSubmitting={setSubmitting}
                  mode={loginMode}
                  setMode={setLoginMode}
                  closeModal={() => setModalOpen(false)}
                />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
