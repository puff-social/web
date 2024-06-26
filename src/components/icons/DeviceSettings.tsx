import { SVGProps } from "react";

export function DeviceSettings(props: SVGProps<SVGSVGElement>) {
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
        d="M7.5 15H9v-4H7.5v1.25H6v1.5h1.5Zm2.5-1.25h8v-1.5h-8ZM15 11h1.5V9.75H18v-1.5h-1.5V7H15ZM6 9.75h8v-1.5H6ZM8 21v-2H4q-.825 0-1.412-.587Q2 17.825 2 17V5q0-.825.588-1.413Q3.175 3 4 3h16q.825 0 1.413.587Q22 4.175 22 5v12q0 .825-.587 1.413Q20.825 19 20 19h-4v2Zm-4-4h16V5H4v12Zm0 0V5v12Z"
      />
    </svg>
  );
}
