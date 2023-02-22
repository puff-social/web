import Modal from "react-modal";
import { useCallback, useEffect, useState } from "react";

import { Cross } from "../icons/Cross";
import { getLeaderboard } from "../../utils/analytics";
import { DeviceLeaderboard } from "../../types/api";
import { automaticRelativeDifference } from "../../utils/time";
import { Tippy } from "../Tippy";

const formatter = new Intl.RelativeTimeFormat("en", {
  style: "long",
  numeric: "always",
});

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
          <h1 className="text-xl">Total Dabs Leaderboards</h1>

          <Cross
            className="opacity-50 hover:opacity-100"
            onClick={() => closeModal()}
          />
        </div>

        <div className="flex flex-col space-y-2">
          {leaderboard ? (
            leaderboard.map((lb, index) => {
              const last_active = automaticRelativeDifference(
                new Date(lb.last_active)
              );
              return (
                <span
                  key={index}
                  className="flex flex-row justify-between p-2 bg-white dark:bg-neutral-900 rounded-md drop-shadow-xl"
                >
                  <span className="flex flex-row">
                    <h3 className="mr-2 opacity-60">#{index + 1}</h3>
                    <span className="flex flex-col">
                      <Tippy content="Device Name" placement="left">
                        <h3 className="font-bold">{lb.device_name}</h3>
                      </Tippy>
                      <Tippy content="Owner Display Name" placement="left">
                        <p className="opacity-60 italic">{lb.owner_name}</p>
                      </Tippy>
                      <Tippy content="Device Birthday" placement="left">
                        <p className="opacity-60">
                          🎂 {new Date(lb.device_birthday).toLocaleDateString()}
                        </p>
                      </Tippy>
                    </span>
                  </span>
                  <span className="flex flex-col justify-between">
                    <Tippy content="Total Dabs" placement="right">
                      <p className="text-right font-bold text-lg">
                        {lb.total_dabs.toLocaleString()}
                      </p>
                    </Tippy>
                    <Tippy content="Last Active" placement="right">
                      <p className="text-right opacity-60">
                        {formatter.format(
                          last_active.duration,
                          last_active.unit
                        )}{" "}
                        🕐
                      </p>
                    </Tippy>
                  </span>
                </span>
              );
            })
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
