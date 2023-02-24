import Modal from "react-modal";
import toast from "react-hot-toast";
import { useCallback, useState } from "react";

import { gateway, Op } from "../../utils/gateway";

export function SettingsModal({ modalOpen, setModalOpen }: any) {
  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const [ourName, setOurName] = useState(() =>
    typeof localStorage != "undefined"
      ? localStorage.getItem("puff-social-name") || "Unnamed"
      : "Unnamed"
  );

  const saveSettings = useCallback(() => {
    gateway.send(Op.UpdateUser, { name: ourName });
    localStorage.setItem("puff-social-name", ourName);
    toast("Updated user settings");
    closeModal();
  }, [ourName]);

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
      <div className="flex flex-col justify-center items-center m-2 p-4 rounded-md bg-white dark:bg-neutral-800 text-black dark:text-white">
        <h3 className="font-bold m-1 text-center">Client Options</h3>
        <div>
          <h3 className="font-bold">Name</h3>
          <input
            value={ourName}
            placeholder="Display name"
            maxLength={32}
            className="w-96 rounded-md p-2 mb-2 border-2 border-slate-300 text-black"
            onChange={({ target: { value } }) => setOurName(value)}
          />
        </div>

        <button
          className="w-96 self-center rounded-md bg-indigo-600 hover:bg-indigo-700 p-1 m-1 text-white"
          onClick={() => saveSettings()}
        >
          Save
        </button>
      </div>
    </Modal>
  );
}
