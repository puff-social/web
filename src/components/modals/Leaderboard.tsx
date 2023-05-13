import { Dialog, Transition } from "@headlessui/react";
import { useCallback, useEffect, useState, Fragment } from "react";

import { Cross } from "../icons/Cross";
import { getLeaderboard } from "../../utils/hash";
import { LeaderboardEntry } from "../../types/api";
import { automaticRelativeDifference } from "../../utils/time";
import { Tippy } from "../Tippy";
import { ChargeSource } from "../../utils/puffco/constants";
import { NameDisplay, ProductModelMap } from "../../utils/constants";
import { PuffcoContainer } from "../puffco";
import { PuffcoOperatingState } from "../../types/gateway";

const formatter = new Intl.RelativeTimeFormat("en", {
  style: "short",
  numeric: "always",
});

function LeaderboardItem({
  index,
  lb,
  last_active,
}: {
  index: number;
  lb: LeaderboardEntry;
  last_active: { duration: number; unit: Intl.RelativeTimeFormatUnit };
}) {
  const dob = automaticRelativeDifference(new Date(lb.devices.dob));

  return (
    <span className="flex flex-row justify-between p-2 bg-white dark:bg-neutral-900 rounded-md drop-shadow-xl">
      <span className="flex flex-row">
        <div className="h-fit flex items-center rounded-md px-1 mr-2 bg-white dark:bg-neutral-700 drop-shadow-xl text-black dark:text-white">
          <p className="opacity-60">#{index}</p>
        </div>
        <span className="flex flex-col">
          <Tippy content="Device Name" placement="left">
            <span className="flex flex-row">
              <p className="font-bold">
                {lb.devices.name} -{" "}
                {lb.devices.model
                  ? ProductModelMap[lb.devices.model] || "Peak"
                  : "Unknown"}
              </p>
              <img
                width={24}
                className="ml-1"
                src={`/emojis/${ProductModelMap[
                  lb.devices.model || 48
                ].toLowerCase()}.png`}
              />
            </span>
          </Tippy>
          <span className="flex flex-row items-center space-x-1">
            {lb.devices.users && lb.devices.users.image ? (
              <>
                <img
                  className="rounded-full p-0.5 w-6 h-6"
                  src={`https://cdn.puff.social/avatars/${lb.devices.user_id}/${
                    lb.devices.users.image
                  }.${lb.devices.users.image.startsWith("a_") ? "gif" : "png"}`}
                />
                <p className="opacity-60 italic truncate">
                  {lb.devices.users.name_display == NameDisplay.FirstName
                    ? lb.devices.users.first_name
                    : lb.devices.users.name_display == NameDisplay.FirstLast
                    ? `${lb.devices.users.first_name} ${lb.devices.users.last_name}`
                    : lb.devices.users.name}
                </p>
              </>
            ) : (
              <p className="opacity-60 italic truncate">
                {lb.devices.user_id ? (
                  <>
                    <p className="opacity-60 italic truncate">
                      {lb.devices.users.name_display == NameDisplay.FirstName
                        ? lb.devices.users.first_name
                        : lb.devices.users.name_display == NameDisplay.FirstLast
                        ? `${lb.devices.users.first_name} ${lb.devices.users.last_name}`
                        : lb.devices.users.name}
                    </p>
                  </>
                ) : (
                  <>&nbsp;</>
                )}
              </p>
            )}
          </span>
          <Tippy
            content={`Device DOB: ${
              lb.devices.dob == "1970-01-01T00:00:01.000Z"
                ? "Unknown"
                : formatter.format(dob.duration, dob.unit)
            }`}
            placement="bottom-start"
          >
            <p className="opacity-60">
              🎂{" "}
              {lb.devices.dob == "1970-01-01T00:00:01.000Z"
                ? "Unknown"
                : new Date(lb.devices.dob).toLocaleDateString()}
            </p>
          </Tippy>
        </span>
      </span>
      <span className="flex flex-col justify-between">
        <Tippy content="Total Dabs" placement="right">
          <p className="text-right font-bold text-lg">
            {lb.devices.dabs.toLocaleString()}
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
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>();

  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const init = useCallback(async () => {
    const items = await getLeaderboard();
    setLeaderboard(items.data.leaderboards);
  }, []);

  useEffect(() => {
    if (modalOpen) init();
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
              <Dialog.Panel className="w-full max-w-screen-xl transform overflow-hidden rounded-2xl bg-white dark:bg-neutral-800 text-black dark:text-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-2">
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
                            new Date(lb.devices.dob)
                          );
                          return (
                            <span
                              key={lb.id}
                              className="flex flex-col bg-white dark:bg-neutral-900 rounded-md drop-shadow-xl w-full p-3"
                            >
                              <span className="flex flex-col justify-center align-center">
                                <div className="flex flex-row drop-shadow justify-between">
                                  <span className="flex flex-col justify-between">
                                    <div className="w-fit flex items-center rounded-md px-1 bg-white dark:bg-neutral-700 drop-shadow-xl text-black dark:text-white">
                                      <p className="text-lg">#{index + 1}</p>
                                    </div>
                                    <span className="flex flex-col space-y-1 justify-end">
                                      <Tippy
                                        content="Total Dabs"
                                        placement="bottom"
                                      >
                                        <p className="font-bold text-lg">
                                          {lb.devices.dabs.toLocaleString()}
                                        </p>
                                      </Tippy>
                                      <Tippy
                                        content={lb.devices.name}
                                        placement="bottom"
                                      >
                                        <p className="text truncate">
                                          {lb.devices.name}
                                        </p>
                                      </Tippy>
                                      <span className="flex flex-row items-center space-x-1">
                                        {lb.devices.users &&
                                        lb.devices.users.image ? (
                                          <>
                                            <img
                                              className="rounded-full p-0.5 w-6 h-6"
                                              src={`https://cdn.puff.social/avatars/${
                                                lb.devices.user_id
                                              }/${lb.devices.users.image}.${
                                                lb.devices.users.image.startsWith(
                                                  "a_"
                                                )
                                                  ? "gif"
                                                  : "png"
                                              }`}
                                            />
                                            <p className="opacity-60 italic truncate">
                                              {lb.devices.users.name_display ==
                                              NameDisplay.FirstName
                                                ? lb.devices.users.first_name
                                                : lb.devices.users
                                                    .name_display ==
                                                  NameDisplay.FirstLast
                                                ? `${lb.devices.users.first_name} ${lb.devices.users.last_name}`
                                                : lb.devices.users.name}
                                            </p>
                                          </>
                                        ) : (
                                          <p className="opacity-60 italic truncate">
                                            {lb.devices.users.id ? (
                                              <>
                                                <p className="opacity-60 italic truncate">
                                                  {lb.devices.users
                                                    .name_display ==
                                                  NameDisplay.FirstName
                                                    ? lb.devices.users
                                                        .first_name
                                                    : lb.devices.users
                                                        .name_display ==
                                                      NameDisplay.FirstLast
                                                    ? `${lb.devices.users.first_name} ${lb.devices.users.last_name}`
                                                    : lb.devices.users.name}
                                                </p>
                                              </>
                                            ) : (
                                              <>&nbsp;</>
                                            )}
                                          </p>
                                        )}
                                      </span>
                                      <Tippy
                                        content={`Device DOB: ${
                                          lb.devices.dob ==
                                          "1970-01-01T00:00:01.000Z"
                                            ? "Unknown"
                                            : formatter.format(
                                                dob.duration,
                                                dob.unit
                                              )
                                        }`}
                                        placement="bottom"
                                      >
                                        <p className="opacity-60">
                                          🎂{" "}
                                          {lb.devices.dob ==
                                          "1970-01-01T00:00:01.000Z"
                                            ? "Unknown"
                                            : new Date(
                                                lb.devices.dob
                                              ).toLocaleDateString()}
                                        </p>
                                      </Tippy>
                                      <Tippy
                                        content="Last Active"
                                        placement="bottom"
                                      >
                                        <p className="opacity-60">
                                          🕐{" "}
                                          {formatter.format(
                                            automaticRelativeDifference(
                                              new Date(lb.devices.last_active)
                                            ).duration,
                                            automaticRelativeDifference(
                                              new Date(lb.devices.last_active)
                                            ).unit
                                          )}
                                        </p>
                                      </Tippy>
                                    </span>
                                  </span>
                                  <span className="flex flex-row drop-shadow">
                                    <PuffcoContainer
                                      model={(
                                        ProductModelMap[lb.devices.model] ||
                                        "peak"
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
                            key={lb.id}
                            lb={lb}
                            index={index + 4}
                            last_active={automaticRelativeDifference(
                              new Date(lb.devices.last_active)
                            )}
                          />
                        );
                      })}
                    </>
                  ) : (
                    <></>
                  )}
                </div>

                <p className="pt-4 opacity-60 flex flex-wrap italic">
                  Your device will only show on the leaderboards if you've
                  logged in with a puffco or discord account
                </p>

                <p className="pt-4 opacity-60 flex flex-wrap">
                  Leaderboard entries are entered once total dabs counter is
                  reported from device, and on device connection.{" "}
                  <span className="font-black">
                    Leaderboards will be moderated for abuse.
                  </span>{" "}
                  (If you would like to opt-out of tracking, submit feedback)
                </p>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
