import Head from "next/head";

import { APIGroup } from "../types/api";
import { GatewayGroup } from "../types/gateway";

export function GroupMeta({
  group,
  initGroup,
}: {
  initGroup?: APIGroup;
  group?: GatewayGroup;
}) {
  return (
    <Head>
      <title>
        {initGroup
          ? `${(group || initGroup).name} - puff.social`
          : "puff.social"}
      </title>
      <link rel="icon" href="/favicon.ico" />

      <meta httpEquiv="X-UA-Compatible" content="ie=edge" />
      <meta name="author" content="puff.social" />
      <meta name="copyright" content="Dustin Rouillard" />
      <meta name="rating" content="General" />
      <meta
        name="url"
        content={
          group
            ? `https://puff.social/${initGroup.group_id}`
            : "https://puff.social"
        }
      />
      <meta
        name="description"
        content={
          group
            ? `Join ${
                initGroup.sesher_count > 0
                  ? `${initGroup.sesher_count} seshers in`
                  : ""
              } ${initGroup.name} on puff.social`
            : ""
        }
      />
      <meta name="twitter:creator" content="@dustinrouillard" />
      <meta name="twitter:site" content="@dustinrouillard" />
      <meta content="summary_large_image" name="twitter:card" />
      <meta
        name="twitter:image"
        content={`https://puff.social/api/group/${
          group
            ? `${initGroup.group_id}?name=${initGroup.name}&seshers=${initGroup.sesher_count}&watchers=${initGroup.watcher_count}&seshCount=${initGroup.sesh_counter}`
            : "not_found"
        }`}
      />
      <meta
        property="og:image"
        content={`https://puff.social/api/group/${
          group
            ? `${initGroup.group_id}?name=${initGroup.name}&seshers=${initGroup.sesher_count}&watchers=${initGroup.watcher_count}&seshCount=${initGroup.sesh_counter}`
            : "not_found"
        }`}
      />
    </Head>
  );
}
