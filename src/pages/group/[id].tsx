import { NextPageContext } from "next";

export default function GroupPageRedirect() {
  return <></>;
}

export async function getServerSideProps(context: NextPageContext) {
  const { id } = context.query;

  return {
    redirect: {
      permanent: true,
      destination: `/${id}`,
    },
  };
}
