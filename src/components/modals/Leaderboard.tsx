import Modal from "react-modal";
import { useCallback, useEffect, useState } from "react";

import { Cross } from "../icons/Cross";
import { getLeaderboard } from "../../utils/analytics";
import { DeviceLeaderboard } from "../../types/api";

export function LeaderboardModal({ modalOpen, setModalOpen }: any) {
  const [leaderboard, setLeaderboard] = useState<DeviceLeaderboard[]>();

  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const init = useCallback(async () => {
    const items = await getLeaderboard();
    setLeaderboard(items.data.leaderboards);
  }, []);

  useEffect(() => {
    init();
  }, []);

  return (
    <Modal
      isOpen={modalOpen}
      onRequestClose={closeModal}
      contentLabel="Leaderboard Modal"
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
      <div className="flex flex-col m-2 p-10 w-[700px] rounded-md bg-white dark:bg-neutral-800 text-black space-y-3 dark:text-white justify-center">
        <div className="flex justify-between justify-center items-center">
          <h1 className="text-xl">Leaderboards</h1>

          <Cross
            className="opacity-50 hover:opacity-100"
            onClick={() => closeModal()}
          />
        </div>

        <div className="flex flex-col space-y-2">
          {leaderboard ? (
            leaderboard.map((lb, index) => (
              <span className="flex flex-row justify-between p-2 bg-neutral-900 rounded-md">
                <span className="flex flex-row">
                  <h3 className="mr-2 opacity-60">#{index + 1}</h3>
                  <span className="flex flex-col">
                    <h3 className="font-bold">{lb.owner_name}</h3>
                    <p className="opacity-60 italic">{lb.device_name}</p>
                  </span>
                </span>
                <span className="flex flex-col">
                  <h3 className="text-right opacity-70">
                    {lb.total_dabs.toLocaleString()}
                  </h3>
                  <h3 className="text-right opacity-70">
                    {new Date(lb.device_birthday).toLocaleDateString()} 🎂
                  </h3>
                </span>
              </span>
            ))
          ) : (
            <></>
          )}
        </div>

        <p className="pt-4 opacity-60">
          Leaderboard entries are entered once total dabs counter is reported
          from device, and on device connection.{" "}
          <span className="font-black">
            Leaderboards will be moderated for abuse.
          </span>{" "}
          (If you would like to opt-out of tracking, submit feedback)
        </p>
      </div>
    </Modal>
  );
}
