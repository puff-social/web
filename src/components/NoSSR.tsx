import dynamic from "next/dynamic";
import React, { PropsWithoutRef } from "react";

const NoSsr = (props: PropsWithoutRef<any>) => (
  <React.Fragment>{props.children}</React.Fragment>
);

export default dynamic(() => Promise.resolve(NoSsr), {
  ssr: false,
});
