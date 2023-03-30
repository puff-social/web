import { NextPageContext } from "next";

import { Discord } from "../../components/icons/Discord";

interface Props {
  platform: string;
  code: string | null;
  state: string | null;
  error: string | null;
  error_text: string | null;
}

export default function OAuthCallback(props: Props) {
  return (
    <div className="flex flex-col justify-center h-screen">
      <div className="flex flex-col justify-center items-center text-center text-black dark:text-white">
        <span>
          <Discord className="w-20 h-auto" />
        </span>
        {!props.error ? (
          <>
            <h2 className="text-xl m-4">Logging in with Discord...</h2>
          </>
        ) : (
          <>
            <h2 className="text-xl m-4">Failed to login with Discord</h2>
            <p className="opacity-60">{props.error_text || "Unknown error"}</p>
          </>
        )}
      </div>
    </div>
  );
}

export async function getServerSideProps(context: NextPageContext) {
  return {
    props: {
      platform: context.query.platform,
      code: context.query.code || null,
      state: context.query.state || null,
      error: context.query.error || null,
      error_text: context.query.error_description || null,
    },
  };
}
