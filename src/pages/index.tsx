import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";

import { APIGroup } from "../types/api";
import { getGroups } from "../utils/api";
import { gateway, Op } from "../utils/gateway";
import { Settings } from "../components/icons/Settings";
import { SettingsModal } from "../components/modals/Settings";
import { InfoModal } from "../components/modals/Info";
import { Info } from "../components/icons/Info";
import { FeedbackModal } from "../components/modals/Feedback";
import { Mail } from "../components/icons/Mail";

export default function Home() {
  const router = useRouter();

  const [groupId, setGroupId] = useState<string>();
  const [groupName, setGroupName] = useState<string>();

  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(() =>
    typeof localStorage != "undefined"
      ? !(localStorage.getItem("puff-social-first-visit") == "false")
      : false
  );

  const [items, setItems] = useState([]);

  async function init() {
    const groups = await getGroups();
    setItems(groups);
  }

  const groupsUpdated = useCallback(
    (groups: APIGroup[]) => {
      setItems(groups);
    },
    [items]
  );

  useEffect(() => {
    init();

    if (typeof localStorage != "undefined")
      localStorage.setItem("puff-social-first-visit", "false");

    gateway.on("public_groups_update", groupsUpdated);
    return () => {
      gateway.removeListener("public_groups_update", groupsUpdated);
    };
  }, []);

  async function connectGroup(group: Pick<APIGroup, "name" | "group_id">) {
    router.push(`/group/${group.group_id}`);
  }

  async function connectToPrivate(id: string) {
    router.push(`/group/${id}`);
  }

  async function createGroup(group_name: string) {
    gateway.send(Op.CreateGroup, { name: group_name });
  }

  return (
    <div className="flex flex-col justify-center h-screen text-black bg-white dark:text-white dark:bg-neutral-900">
      <Head>
        <title>puff.social</title>
      </Head>

      <div className="flex flex-row items-center m-4">
        <div>
          <h1 className="text-4xl font-bold">puff.social</h1>
          <h3 className="text font-bold">
            by{" "}
            <a href="https://dstn.to" target="_blank">
              Dustin
            </a>{" "}
            (idea by Roberto)
          </h3>
        </div>
        <div
          className="flex items-center rounded-md p-1 bg-white dark:bg-neutral-800 cursor-pointer h-fit m-1 drop-shadow-xl"
          onClick={() => setSettingsModalOpen(true)}
        >
          <Settings />
        </div>
        <div
          className="flex items-center rounded-md p-1 bg-white dark:bg-neutral-800 cursor-pointer h-fit m-1 drop-shadow-xl"
          onClick={() => setInfoModalOpen(true)}
        >
          <Info />
        </div>
        <div
          className="flex items-center rounded-md p-1 bg-white dark:bg-neutral-800 cursor-pointer h-fit m-1 drop-shadow-xl"
          onClick={() => setFeedbackModalOpen(true)}
        >
          <Mail />
        </div>
      </div>

      <SettingsModal
        modalOpen={settingsModalOpen}
        setModalOpen={setSettingsModalOpen}
      />

      <InfoModal modalOpen={infoModalOpen} setModalOpen={setInfoModalOpen} />
      <FeedbackModal
        modalOpen={feedbackModalOpen}
        setModalOpen={setFeedbackModalOpen}
      />

      <div className="flex flex-col">
        <div className="flex flex-col rounded-md bg-white dark:bg-neutral-800 p-2 m-3 w-[600px] text-black dark:text-white drop-shadow-xl">
          <h2 className="text-xl font-bold p-1">Join a group</h2>
          <div className="flex flex-col overflow-scroll h-80 p-2 justify-center">
            {items.length > 0 ? (
              items.map((item) => (
                <div
                  className="flex flex-row justify-between items-center rounded-md bg-white dark:bg-stone-800 drop-shadow-lg p-1 mt-2 cursor-pointer hover:bg-gray-300 dark:hover:bg-stone-900"
                  onClick={() => connectGroup(item)}
                >
                  <span>
                    <h3 className="m-0">{item.name}</h3>
                    <p className="m-0 opacity-60 uppercase">{item.state}</p>
                  </span>
                  <span>
                    <p className="m-0 opacity-80">
                      {item.member_count.toLocaleString()}
                    </p>
                  </span>
                </div>
              ))
            ) : (
              <div className="flex justify-center w-full">
                <h2 className="text-gray-400 w-96 text-center">
                  There are no public groups, join a private group or create one
                  below :)
                </h2>
              </div>
            )}
          </div>
          <div className=" flex flex-row rounded-md bg-white dark:bg-neutral-800 justify-center">
            <input
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full rounded-md p-2 m-1 text-black border-2 border-slate-300"
              placeholder="Private Group ID"
            />
            <button
              onClick={() => connectToPrivate(groupId)}
              className="w-full rounded-md bg-indigo-600 text-white p-1 m-1"
            >
              Join Group
            </button>
          </div>
        </div>
        <div className="flex flex-col rounded-md bg-white dark:bg-neutral-800 p-2 m-3 justify-center w-[600px] text-black dark:text-white drop-shadow-xl">
          <h2 className="text-xl font-bold p-1">Create a new group</h2>
          <div className="flex">
            <input
              value={groupName}
              maxLength={32}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full rounded-md p-2 m-1 text-black border-2 border-slate-300"
              placeholder="Group name"
            />
            <button
              onClick={() => createGroup(groupName)}
              className="w-full rounded-md bg-lime-700 text-white p-1 m-1"
            >
              Create Group
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
