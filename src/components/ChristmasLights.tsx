import { HTMLAttributes, ReactElement } from "react";

interface Props {
  count?: number;
  altClass?: HTMLAttributes<HTMLDivElement>["className"];
}

export function ChristmasLights(props: Props): ReactElement {
  return (
    <ul
      className={`text-center whitespace-nowrap overflow-hidden absolute p-0 pointer-events-none w-full h-[10%] ${props.altClass}`}
    >
      {new Array(props.count ?? 100).fill(1).map((_, index) => (
        <li className="christmas" key={index} />
      ))}
    </ul>
  );
}
