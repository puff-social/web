import Modal from "react-modal";
import toast from "react-hot-toast";
import { useCallback, useState } from "react";

import { gateway, Op } from "../../utils/gateway";
import { Checkmark } from "../icons/Checkmark";
import { Lock, Unlock } from "../icons/Lock";

export function UserSettingsModal({ modalOpen, setModalOpen }: any) {
  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const [ourName, setOurName] = useState(() =>
    typeof localStorage != "undefined"
      ? localStorage.getItem("puff-social-name") || "Unnamed"
      : "Unnamed"
  );

  const [defaultVisibility, setDefaultVisibility] = useState(() =>
    typeof localStorage != "undefined"
      ? localStorage.getItem("puff-default-visbility") || "private"
      : "private"
  );

  const saveSettings = useCallback(() => {
    gateway.send(Op.UpdateUser, { name: ourName });
    localStorage.setItem("puff-social-name", ourName);
    localStorage.setItem("puff-default-visbility", defaultVisibility);
    toast("Updated user settings", {
      position: "top-right",
    });
    closeModal();
  }, [ourName, defaultVisibility]);

  return (
    <Modal
      isOpen={modalOpen}
      onRequestClose={closeModal}
      contentLabel="Settings Modal"
      style={{
        overlay: {
          background: "#00000070",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 200,
        },
        content: {
          inset: "unset",
          backgroundColor: "#00000000",
          border: "none",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 201,
        },
      }}
    >
      <div className="flex flex-col m-2 p-4 rounded-md bg-white dark:bg-neutral-800 text-black dark:text-white">
        <p className="font-bold m-1 text-center">Client Options</p>
        <span>
          <p className="font-bold">Name</p>
          <input
            value={ourName}
            placeholder="Display name"
            maxLength={32}
            className="w-full rounded-md p-2 mb-2 border-2 border-slate-300 text-black"
            onChange={({ target: { value } }) => setOurName(value)}
          />
        </span>
        <hr className="my-2" />
        <p className="font-bold m-1 text-center">Group Defaults</p>
        <span>
          <p className="font-bold">Visibility</p>
          <span className="flex flex-row space-x-2 items-center">
            <span
              className="p-4 bg-white dark:bg-stone-800 drop-shadow-lg hover:bg-gray-300 dark:hover:bg-stone-900 rounded-md w-full flex flex-row justify-between items-center"
              onClick={() => setDefaultVisibility("public")}
            >
              <span className="flex flex-row items-center">
                <Unlock className="w-5 mr-2" />
                <p>Public</p>
              </span>
              {defaultVisibility == "public" ? (
                <Checkmark className="h-5 text-green-600 dark:text-green-500" />
              ) : (
                ""
              )}
            </span>
            <span
              className="p-4 bg-white dark:bg-stone-800 drop-shadow-lg hover:bg-gray-300 dark:hover:bg-stone-900 rounded-md w-full flex flex-row justify-between items-center"
              onClick={() => setDefaultVisibility("private")}
            >
              <span className="flex flex-row items-center">
                <Lock className="w-5 mr-2" />
                <p>Private</p>
              </span>
              {defaultVisibility == "private" ? (
                <Checkmark className="h-5 text-green-600 dark:text-green-500" />
              ) : (
                ""
              )}
            </span>
          </span>
        </span>

        <button
          className="w-96 self-center rounded-md bg-indigo-600 hover:bg-indigo-700 p-1 mt-3 text-white"
          onClick={() => saveSettings()}
        >
          Save
        </button>
      </div>
    </Modal>
  );
}
