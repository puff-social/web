import { SVGProps } from "react";

export function VoiceWaves(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="28"
      height="28"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        fill="none"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1.5"
        d="M12 4v16M8 9v6m12-5v4M4 10v4m12-7v10"
      />
    </svg>
  );
}
