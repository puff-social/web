import Modal from "react-modal";
import { useCallback, useEffect, useState } from "react";

import { Cross } from "../icons/Cross";
import { getLeaderboard } from "../../utils/analytics";
import { DeviceLeaderboard } from "../../types/api";
import { automaticRelativeDifference } from "../../utils/time";
import { Tippy } from "../Tippy";
import { ChargeSource, ProductModelMap } from "../../utils/puffco";
import { PuffcoContainer } from "../puffco";
import { PuffcoOperatingState } from "../../types/gateway";

const formatter = new Intl.RelativeTimeFormat("en", {
  style: "short",
  numeric: "always",
});

function LeaderboardItem({ index, lb, last_active }) {
  const dob = automaticRelativeDifference(new Date(lb.device_dob));

  return (
    <span className="flex flex-row justify-between p-2 bg-white dark:bg-neutral-900 rounded-md drop-shadow-xl">
      <span className="flex flex-row">
        <p className="mr-2 opacity-60">#{index}</p>
        <span className="flex flex-col">
          <Tippy content="Device Name" placement="left">
            <span className="flex flex-row">
              <p className="font-bold">
                {lb.device_name} -{" "}
                {lb.device_model
                  ? ProductModelMap[lb.device_model] || "Peak"
                  : "Unknown"}
              </p>
              <img
                width={18}
                className="ml-1"
                src={`/emojis/${ProductModelMap[
                  lb.device_model || 48
                ].toLowerCase()}.png`}
              />
            </span>
          </Tippy>
          <p className="opacity-60 italic">{lb.owner_name}</p>
          <Tippy
            content={`Device DOB: ${
              lb.device_dob == "1970-01-01T00:00:01.000Z"
                ? "Unknown"
                : formatter.format(dob.duration, dob.unit)
            }`}
            placement="bottom-start"
          >
            <p className="opacity-60">
              🎂{" "}
              {lb.device_dob == "1970-01-01T00:00:01.000Z"
                ? "Unknown"
                : new Date(lb.device_dob).toLocaleDateString()}
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
            {formatter.format(last_active.duration, last_active.unit)} 🕐
          </p>
        </Tippy>
      </span>
    </span>
  );
}

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
      <div className="flex flex-col m-2 p-10 rounded-md bg-white dark:bg-neutral-800 text-black space-y-3 dark:text-white justify-center w-[1000px]">
        <div className="flex justify-between justify-center items-center">
          <h1 className="text-xl">Total Dabs Leaderboards</h1>

          <Cross
            className="opacity-50 hover:opacity-100"
            onClick={() => closeModal()}
          />
        </div>

        <div className="flex flex-col space-y-2">
          {leaderboard ? (
            <>
              <div className="flex space-x-2">
                {leaderboard.slice(0, 3).map((lb, index) => {
                  const dob = automaticRelativeDifference(
                    new Date(lb.device_dob)
                  );
                  return (
                    <span className="flex flex-col bg-white dark:bg-neutral-900 rounded-md drop-shadow-xl rounded-md w-96 p-3">
                      <span className="flex flex-col justify-center align-center">
                        <div className="flex flex-row drop-shadow justify-between">
                          <span className="flex flex-col justify-between">
                            <p className="text-lg">#{index + 1}</p>
                            <span className="flex flex-col space-y-1 justify-end w-36">
                              <Tippy content="Total Dabs" placement="bottom">
                                <p className="font-bold text-lg">
                                  {lb.total_dabs.toLocaleString()}
                                </p>
                              </Tippy>
                              <Tippy
                                content={lb.device_name}
                                placement="bottom"
                              >
                                <p className="text truncate">
                                  {lb.device_name}
                                </p>
                              </Tippy>
                              <p className="opacity-60 italic truncate">
                                {lb.owner_name}
                              </p>
                              <Tippy
                                content={`Device DOB: ${
                                  lb.device_dob == "1970-01-01T00:00:01.000Z"
                                    ? "Unknown"
                                    : formatter.format(dob.duration, dob.unit)
                                }`}
                                placement="bottom"
                              >
                                <p className="opacity-60">
                                  🎂{" "}
                                  {lb.device_dob == "1970-01-01T00:00:01.000Z"
                                    ? "Unknown"
                                    : new Date(
                                        lb.device_dob
                                      ).toLocaleDateString()}
                                </p>
                              </Tippy>
                              <Tippy content="Last Active" placement="bottom">
                                <p className="opacity-60">
                                  🕐{" "}
                                  {formatter.format(
                                    automaticRelativeDifference(
                                      new Date(lb.last_active)
                                    ).duration,
                                    automaticRelativeDifference(
                                      new Date(lb.last_active)
                                    ).unit
                                  )}
                                </p>
                              </Tippy>
                            </span>
                          </span>
                          <span className="flex flex-row drop-shadow">
                            <PuffcoContainer
                              model={(
                                ProductModelMap[lb.device_model] || "peak"
                              ).toLowerCase()}
                              id={index.toString()}
                              className="flex items-center justify-center self-center w-[90px]"
                              device={{
                                activeColor:
                                  index == 0
                                    ? {
                                        r: 255,
                                        g: 215,
                                        b: 0,
                                      }
                                    : index == 1
                                    ? {
                                        r: 192,
                                        g: 192,
                                        b: 192,
                                      }
                                    : {
                                        r: 205,
                                        g: 127,
                                        b: 50,
                                      },
                                state: PuffcoOperatingState.IDLE,
                                chargeSource: ChargeSource.None,
                              }}
                            />
                          </span>
                        </div>
                      </span>
                    </span>
                  );
                })}
              </div>
              {leaderboard.slice(3).map((lb, index) => {
                return (
                  <LeaderboardItem
                    lb={lb}
                    index={index + 4}
                    last_active={automaticRelativeDifference(
                      new Date(lb.last_active)
                    )}
                  />
                );
              })}
            </>
          ) : (
            <></>
          )}
        </div>

        <p className="pt-4 opacity-60 flex flex-wrap">
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
