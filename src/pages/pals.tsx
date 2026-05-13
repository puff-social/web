import Head from "next/head";

export default function PalsPageRedirect() {
  return (
    <Head>
      <title>{`Refer your friends to buy a Puffco and give them $30 off!`}</title>
      <link rel="icon" href="/favicon.ico" />

      <meta httpEquiv="X-UA-Compatible" content="ie=edge" />
      <meta name="author" content="puff.social" />
      <meta name="copyright" content="Dustin Rouillard" />
      <meta name="theme-color" content="#fbc123" />
      <meta name="rating" content="General" />
      <meta name="url" content={`https://puff.social/pals`} />
      <meta
        name="summary"
        content={`Refer your friends to buy a Puffco and give them $30 off!`}
      />
      <meta
        name="subject"
        content={`Refer your friends to buy a Puffco and give them $30 off!`}
      />
      <meta
        name="subtitle"
        content={`Refer your friends to buy a Puffco and give them $30 off!`}
      />
      <meta
        name="description"
        content={`If you or someone you know is trying to buy a Puffco device, this offers them $30 off, and it also doubles in contributing to our community giveaways!`}
      />
      <meta name="twitter:creator" content="@puffdotsocial" />
      <meta name="twitter:site" content="@puffdotsocial" />
      <meta content="summary_large_image" name="twitter:card" />
      <meta
        name="twitter:image"
        content="https://cdn.puff.social/assets/meta/pals.png"
      />
      <meta
        property="og:image"
        content="https://cdn.puff.social/assets/meta/pals.png"
      />

      <meta http-equiv="refresh" content="0; url=http://rwrd.io/6ao52xb?s" />
    </Head>
  );
}
