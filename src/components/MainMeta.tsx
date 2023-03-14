import Head from "next/head";

export function MainMeta({ pageName }: { pageName?: string }) {
  return (
    <Head>
      <title>{`${pageName ? `${pageName} - ` : ""} puff.social`}</title>
      <link rel="icon" href="/favicon.ico" />

      <meta httpEquiv="X-UA-Compatible" content="ie=edge" />
      <meta name="author" content="puff.social" />
      <meta name="copyright" content="Dustin Rouillard" />
      <meta name="rating" content="General" />
      <meta name="url" content={`https://puff.social/`} />
      <meta
        name="description"
        content={`Hop into a group, link your device, invite some homies, and sesh away!`}
      />
      <meta name="twitter:creator" content="@dustinrouillard" />
      <meta name="twitter:site" content="@dustinrouillard" />
      <meta content="summary_large_image" name="twitter:card" />
      <meta name="twitter:image" content="/meta.png" />
      <meta property="og:image" content="/meta.png" />
    </Head>
  );
}
