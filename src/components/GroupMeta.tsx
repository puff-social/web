import Head from "next/head";

import { GatewayGroup } from "../types/gateway";

export function GroupMeta({ group }: { group: GatewayGroup }) {
  return (
    <Head>
      <title>{group.name} - puff.social</title>
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
      <meta
        property="og:image"
        content={`https://puff.social/api/group/${group.group_id}`}
      />
    </Head>
  );
}
