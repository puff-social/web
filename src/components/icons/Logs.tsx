import { SVGProps } from "react";

export function Logs(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="28"
      height="28"
      viewBox="0 0 48 48"
      {...props}
    >
      <g
        fill="none"
        stroke="currentColor"
        stroke-linejoin="round"
        stroke-width="4"
      >
        <path d="M13 10h28v34H13z" />
        <path
          stroke-linecap="round"
          d="M35 10V4H8a1 1 0 0 0-1 1v33h6m8-16h12m-12 8h12"
        />
      </g>
    </svg>
  );
}
