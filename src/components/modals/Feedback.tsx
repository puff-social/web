import Modal from "react-modal";
import { toast } from "react-hot-toast";
import { useCallback, useState } from "react";

import { Cross } from "../icons/Cross";
import { sendFeedback } from "../../utils/analytics";

export function FeedbackModal({ modalOpen, setModalOpen }: any) {
  const [message, setMessage] = useState<string>("");

  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const send = useCallback(() => {
    sendFeedback(message);
    setMessage("");
    toast("Feedback sent", {
      icon: "✅",
      duration: 2000,
      position: "top-right",
    });
    closeModal();
  }, [message]);

  return (
    <Modal
      isOpen={modalOpen}
      onRequestClose={closeModal}
      contentLabel="Feedback Modal"
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
      <div className="flex flex-col m-2 p-10 w-[700px] rounded-md bg-white dark:bg-neutral-800 text-black space-y-3 dark:text-white justify-center">
        <div className="flex justify-between justify-center items-center">
          <h1 className="text-xl">Send Feedback</h1>

          <Cross
            className="opacity-50 hover:opacity-100"
            onClick={() => closeModal()}
          />
        </div>

        <p className="w-[500px] pb-4">
          Hey we're not perfect, if you have a suggestion or found a problem,
          let us know about it!
        </p>

        <span className="flex flex-col">
          <textarea
            className="p-4 border-2 border-slate-400 rounded-md text-black"
            placeholder="Type a message..."
            maxLength={1024}
            rows={4}
            value={message}
            onChange={({ target: { value } }) => {
              if (value.length <= 1024) setMessage(value);
            }}
            onKeyDown={(event) => {
              if (event.code == "Enter" && event.shiftKey) send();
            }}
          />
          <p className="opacity-50 pt-1 self-end">
            {message.length.toLocaleString()} / 1,024
          </p>
          <button
            className="w-32 self-end rounded-md bg-indigo-600 hover:bg-indigo-700 p-1 mt-4 text-white"
            onClick={() => send()}
          >
            Send
          </button>
        </span>
      </div>
    </Modal>
  );
}
