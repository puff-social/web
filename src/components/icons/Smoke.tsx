import { SVGProps } from "react";

export function Smoke(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="28"
      height="28"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        fill="currentColor"
        d="M17 19v3h-2v-3c0-1.1-.9-2-2-2h-3c-2.8 0-5-2.2-5-5c0-1.2.4-2.2 1.1-3.1C3.8 8.5 2 6.4 2 4c0-.7.2-1.4.4-2h2.4c-.5.5-.8 1.2-.8 2c0 1.7 1.3 3 3 3h3v2c-1.7 0-3 1.3-3 3s1.3 3 3 3h3c2.2 0 4 1.8 4 4m.9-10.1C20.2 8.5 22 6.4 22 4c0-.7-.2-1.4-.4-2h-2.4c.5.5.8 1.2.8 2c0 1.7-1.3 3-3 3h-1.2c.1.3.2.6.2 1c0 1.7-1.3 3-3 3v2c2.8 0 5 2.2 5 5v4h2v-4c0-2.7-1.5-5-3.8-6.2c.9-.7 1.5-1.7 1.7-2.9Z"
      />
    </svg>
  );
}