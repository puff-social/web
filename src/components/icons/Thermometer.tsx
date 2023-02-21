import { SVGProps } from "react";

export function Thermometer(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="28"
      height="28"
      viewBox="0 2.4 24 24"
      {...props}
    >
      <path
        fill="currentColor"
        d="M12 24.4q-2.075 0-3.538-1.462T7 19.4q0-1.2.525-2.237T9 15.4v-8q0-1.25.875-2.125T12 4.4q1.25 0 2.125.875T15 7.4v8q.95.725 1.475 1.763T17 19.4q0 2.075-1.463 3.538T12 24.4Zm-1-11h2v-1h-1v-1h1v-2h-1v-1h1v-1q0-.425-.288-.712T12 6.4q-.425 0-.713.288T11 7.4v6Z"
      />
    </svg>
  );
}
