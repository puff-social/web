import Modal from "react-modal";
import { useCallback, useEffect, useState } from "react";

import { GatewayGroup, GatewayGroupMember } from "../../types/gateway";
import { Kick } from "../icons/Kick";
import { Crown } from "../icons/Crown";
import { Tippy } from "../Tippy";
import { Cross } from "../icons/Cross";
import { Op, gateway } from "../../utils/gateway";
import { Person } from "../icons/Person";
import { automaticRelativeDifference } from "../../utils/time";
import { Mobile } from "../icons/Mobile";
import { NameDisplay, UserFlags } from "../../utils/constants";
import { Money } from "../icons/Money";
import { Wrench } from "../icons/Wrench";

export interface ModalProps {
  modalOpen: boolean;
  setModalOpen: Function;
  group: GatewayGroup;
  members: GatewayGroupMember[];
}

const formatter = new Intl.RelativeTimeFormat("en", {
  style: "short",
  numeric: "always",
});

function GroupListMember({
  member,
  group,
}: {
  member: GatewayGroupMember;
  group: GatewayGroup;
}) {
  const [joinTime, setJoinTime] = useState(
    automaticRelativeDifference(new Date(member.group_joined))
  );

  useEffect(() => {
    const int = setInterval(() => {
      setJoinTime(automaticRelativeDifference(new Date(member.group_joined)));
    }, 1000);

    return () => {
      clearInterval(int);
    };
  }, []);

  return (
    <span className="flex flex-row justify-between items-center bg-gray-200/50 dark:bg-neutral-600/50 rounded-md p-1">
      <span className="flex flex-col">
        <span className="flex flex-row items-center space-x-2">
          <p className="text-sm">
            {member?.user?.name_display == NameDisplay.FirstName
              ? member?.user?.first_name
              : member?.user?.name_display == NameDisplay.FirstLast
              ? `${member?.user?.first_name} ${member?.user?.last_name}`
              : member?.user?.name || member.device_state.deviceName || "Guest"}
          </p>
          <p className="text-xs opacity-30">
            {formatter.format(joinTime.duration, joinTime.unit)}
          </p>
        </span>
        <p className="text-xs opacity-40">
          {typeof member.device_state == "object" &&
          Object.keys(member.device_state || {}).length > 0
            ? "Sesher"
            : "Watcher"}
        </p>
      </span>
      <span className="flex flex-row space-x-1 items-center">
        {gateway.session_id == group.owner_session_id &&
        member.session_id != gateway.session_id ? (
          <>
            <Tippy content="Transfer ownership" placement="bottom-start">
              <span
                className="bg-gray-300 dark:bg-neutral-600 text-green-700 hover:text-green-600 rounded-md p-1 cursor-pointer"
                onClick={() =>
                  gateway.send(Op.TransferOwnership, {
                    session_id: member.session_id,
                  })
                }
              >
                <Crown className="w-5 h-5" />
              </span>
            </Tippy>
            <Tippy content="Kick member" placement="bottom-start">
              <span
                className="bg-gray-300 dark:bg-neutral-600 text-red-400 hover:text-red-300 rounded-md p-1 cursor-pointer"
                onClick={() =>
                  gateway.send(Op.KickFromGroup, {
                    session_id: member.session_id,
                  })
                }
              >
                <Kick className="w-5 h-5" />
              </span>
            </Tippy>
          </>
        ) : (
          <></>
        )}
        {member.session_id == gateway.session_id ? (
          <Tippy content="You" placement="left-end">
            <span className="text-gray-400 dark:text-gray-400 hover:text-green-600 transition-all rounded-md p-1">
              <Person className="w-4 h-4" />
            </span>
          </Tippy>
        ) : (
          <></>
        )}
        {member.user?.flags & UserFlags.supporter ? (
          <Tippy content="Supporter" placement="left-end">
            <span className="text-gray-400 dark:text-gray-400 hover:text-yellow-400 transition-all rounded-md p-1">
              <Money className="w-4 h-4" />
            </span>
          </Tippy>
        ) : (
          <></>
        )}
        {member.user?.flags & UserFlags.admin ? (
          <Tippy content="Global Admin" placement="left-end">
            <span className="text-gray-400 dark:text-gray-400 hover:text-blue-600 transition-all rounded-md p-1">
              <Wrench className="w-4 h-4" />
            </span>
          </Tippy>
        ) : (
          <></>
        )}
        {member.session_id == group.owner_session_id ? (
          <Tippy content="Group owner" placement="left-end">
            <span className="text-green-700 hover:text-green-600 rounded-md p-1">
              <Crown className="w-4 h-4" />
            </span>
          </Tippy>
        ) : (
          <></>
        )}
        {member.mobile ? (
          <Tippy content="Mobile" placement="left-end">
            <span className="text-black dark:text-white opacity-50 rounded-md p-1">
              <Mobile className="w-4 h-4" />
            </span>
          </Tippy>
        ) : (
          <></>
        )}
      </span>
    </span>
  );
}

export function GroupMembersModal({
  modalOpen,
  setModalOpen,
  group,
  members,
}: ModalProps) {
  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  return (
    <Modal
      isOpen={modalOpen}
      onRequestClose={closeModal}
      contentLabel="Group Members Modal"
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
      <div className="flex flex-col m-2 p-6 rounded-md bg-white dark:bg-neutral-800 text-black dark:text-white">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-xl">Members</h1>

          <Cross
            className="opacity-50 hover:opacity-100 w-6 h-6"
            onClick={() => closeModal()}
          />
        </div>

        <div className="flex flex-col w-80 max-h-96 overflow-y-scroll pr-2 space-y-1">
          {members
            .sort((member) =>
              typeof member.device_state == "object" &&
              Object.keys(member.device_state || {}).length > 0
                ? 1
                : -1
            )
            .sort((member) =>
              member.session_id == group.owner_session_id ? -1 : 1
            )
            .sort(
              (a, b) =>
                new Date(a.group_joined).getTime() -
                new Date(b.group_joined).getTime()
            )
            .map((member) => (
              <GroupListMember member={member} group={group} />
            ))}
        </div>
      </div>
    </Modal>
  );
}
