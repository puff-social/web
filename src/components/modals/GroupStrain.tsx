import Modal from "react-modal";
import toast from "react-hot-toast";
import { useCallback, useState } from "react";

import { gateway, Op } from "../../utils/gateway";

export function GroupStrainModal({ modalOpen, setModalOpen, strain }: any) {
  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const [currentStrain, setCurrentStrain] = useState(() => strain);

  const saveSettings = useCallback(() => {
    gateway.send(Op.GroupStrain, { strain: currentStrain });
    toast("Updated strain for this group", {
      position: "top-right",
    });
    closeModal();
  }, [currentStrain]);

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
        <p className="font-bold m-1 text-center">Group Session Options</p>
        <span>
          <p className="font-bold">Strain Name</p>
          <input
            value={currentStrain}
            placeholder="Strain"
            maxLength={32}
            className="w-full rounded-md p-2 mb-2 border-2 border-slate-300 text-black"
            onChange={({ target: { value } }) => setCurrentStrain(value)}
          />
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
