import { Tippy } from "../Tippy";

import { Eye } from "../icons/Eye";
import { Checkmark } from "../icons/Checkmark";
import { Snowflake } from "../icons/Snowflake";
import { Smoke, AltSmoke } from "../icons/Smoke";

import { GatewayGroup, GroupState } from "../../types/gateway";
import { Lock } from "../icons/Lock";

interface Props {
  group: GatewayGroup;
  seshers: number;
  watchers: number;
  setGroupMembersModalOpen: Function;
}

export function GroupHeader({
  group,
  seshers,
  watchers,
  setGroupMembersModalOpen,
}: Props) {
  return (
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
      <p className="text-black dark:text-white font-bold">
        {group.sesh_counter == 0
          ? "No seshes yet!"
          : `${group.sesh_counter.toLocaleString()} seshes this group`}
      </p>
      <Tippy content="Seshers / Watchers (Click for list)" placement="right">
        <span
          className="flex flex-row items-center space-x-2 w-fit opacity-60 cursor-pointer"
          onClick={() => setGroupMembersModalOpen(true)}
        >
          <span className="flex flex-row items-center text-black dark:text-white font-bold space-x-1">
            <p>{seshers}</p>
            <AltSmoke />
          </span>
          <span className="flex flex-row items-center text-black dark:text-white font-bold space-x-1">
            <p>{watchers}</p>
            <Eye />
          </span>
        </span>
      </Tippy>
    </div>
  );
}