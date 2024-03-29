import { Tippy } from "../Tippy";

import { Eye } from "../icons/Eye";
import { Checkmark } from "../icons/Checkmark";
import { Snowflake } from "../icons/Snowflake";
import { Smoke, AltSmoke } from "../icons/Smoke";

import { GatewayGroup, GroupState } from "../../types/gateway";
import { Lock } from "../icons/Lock";
import { useSelector } from "react-redux";
import { selectGroupState } from "../../state/slices/group";
import {
  EASTER_EGG_CYCLE_COUNTS,
  validState,
} from "@puff-social/commons/dist/puffco";
import { PuffLogo } from "../../assets/Logo";

interface Props {
  group: GatewayGroup;
  setGroupMembersModalOpen: Function;
}

export function GroupHeader({ setGroupMembersModalOpen }: Props) {
  const { group } = useSelector(selectGroupState);

  return (
    <div className="flex flex-row space-x-3">
      <PuffLogo className="h-16 w-16 opacity-30 hover:opacity-100 text-black dark:text-white transition-all" />
      <div className="flex flex-col">
        <h1 className="flex flex-row text-4xl text-black dark:text-white font-bold items-center">
          {group.name}
          <Tippy content="Private group" placement="right">
            <span className="ml-3 opacity-80 cursor-default ">
              {group.visibility == "private" ? <Lock /> : ""}
            </span>
          </Tippy>
          <hr className="bg-white w-1 h-full opacity-40 rounded-full mx-3" />
          <Tippy
            extraClass="capitalize"
            content={`State: ${group.state}`}
            placement="right"
          >
            <span className="flex items-center rounded-md p-1 bg-white dark:bg-neutral-800 h-fit m-1 drop-shadow-xl">
              {group.state == GroupState.Chilling ? (
                <Snowflake />
              ) : group.state == GroupState.Awaiting ? (
                <Checkmark />
              ) : (
                <Smoke />
              )}
            </span>
          </Tippy>
        </h1>
        <div className="flex flex-row space-x-4">
          <p
            className={`text-black dark:text-white font-bold ${
              EASTER_EGG_CYCLE_COUNTS.includes(group.sesh_counter)
                ? "rainbow"
                : ""
            }`}
          >
            {group.sesh_counter == 0
              ? "No seshes yet!"
              : `${group.sesh_counter.toLocaleString()} seshes this group`}
          </p>
          <hr className="bg-white/20 border-transparent w-0.5 h-1/2 self-center opacity-40 rounded-full mx-3" />
          <Tippy
            content="Seshers / Watchers (Click for list)"
            placement="right"
          >
            <div
              className="flex flex-row items-center space-x-2 w-fit opacity-60 cursor-pointer"
              onClick={() => setGroupMembersModalOpen(true)}
            >
              <div className="flex flex-row items-center text-black dark:text-white font-bold space-x-1">
                <p className="text-base">
                  {
                    group.members.filter((mem) => validState(mem.device_state))
                      .length
                  }
                </p>
                <AltSmoke />
              </div>
              <div className="flex flex-row items-center text-black dark:text-white font-bold space-x-1">
                <p className="text-base">
                  {
                    group.members.filter((mem) => !validState(mem.device_state))
                      .length
                  }
                </p>
                <Eye />
              </div>
            </div>
          </Tippy>
        </div>
      </div>
    </div>
  );
}
