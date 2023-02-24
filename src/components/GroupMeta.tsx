import Head from "next/head";

import { APIGroup } from "../types/api";

export function GroupMeta({ group }: { group: APIGroup }) {
  return (
    <Head>
      <title>{`${group.name} - puff.social`}</title>
      <link rel="icon" href="/favicon.ico" />

      <meta httpEquiv="X-UA-Compatible" content="ie=edge" />
      <meta name="author" content="puff.social" />
      <meta name="copyright" content="Dustin Rouillard" />
      <meta name="rating" content="General" />
      <meta
        name="url"
        content={`https://puff.social/group/${group.group_id}`}
      />
      <meta name="description" content={`Join ${group.name} on puff.social`} />
      <meta name="twitter:creator" content="@dustinrouillard" />
      <meta name="twitter:site" content="@dustinrouillard" />
      <meta content="summary_large_image" name="twitter:card" />
      <meta
        name="twitter:image"
        content={`https://puff.social/api/group/${group.group_id}`}
      />
      <meta
        property="og:image"
        content={`https://puff.social/api/group/${group.group_id}`}
      />
    </Head>
  );
}
