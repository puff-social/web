import Head from "next/head";

import { APIGroup } from "../types/api";

export function GroupMeta({ group }: { group?: APIGroup }) {
  return (
    <Head>
      <title>{group ? `${group.name} - puff.social` : "puff.social"}</title>
      <link rel="icon" href="/favicon.ico" />

      <meta httpEquiv="X-UA-Compatible" content="ie=edge" />
      <meta name="author" content="puff.social" />
      <meta name="copyright" content="Dustin Rouillard" />
      <meta name="rating" content="General" />
      <meta
        name="url"
        content={
          group
            ? `https://puff.social/${group.group_id}`
            : "https://puff.social"
        }
      />
      <meta
        name="description"
        content={
          group
            ? `Join ${
                group.sesher_count > 0 ? `${group.sesher_count} seshers in` : ""
              } ${group.name} on puff.social`
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
            ? `${group.group_id}?name=${group.name}&seshers=${group.sesher_count}&watchers=${group.watcher_count}&seshCount=${group.sesh_counter}`
            : "not_found"
        }`}
      />
      <meta
        property="og:image"
        content={`https://puff.social/api/group/${
          group
            ? `${group.group_id}?name=${group.name}&seshers=${group.sesher_count}&watchers=${group.watcher_count}&seshCount=${group.sesh_counter}`
            : "not_found"
        }`}
      />
    </Head>
  );
}
