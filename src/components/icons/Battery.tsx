import { SVGProps } from "react";

export function Battery(props: SVGProps<SVGSVGElement>) {
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
        d="M17 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Zm0 8H4V9h13Zm4-5a1 1 0 0 0-1 1v2a1 1 0 0 0 2 0v-2a1 1 0 0 0-1-1Z"
      />
    </svg>
  );
}

export function BatteryBolt(props: SVGProps<SVGSVGElement>) {
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
        d="M6.69 15H4V9h2.31a1 1 0 0 0 0-2H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2.69a1 1 0 1 0 0-2Zm7.2-2.56a1.27 1.27 0 0 0 .06-.18a1.42 1.42 0 0 0 0-.2v-.18a.65.65 0 0 0-.05-.2a.89.89 0 0 0-.08-.17a.86.86 0 0 0-.1-.16l-.16-.13l-.09-.09h-.06l-.18-.06h-3.5l1.45-2.5a1 1 0 1 0-1.74-1l-2.31 4v.06a1.27 1.27 0 0 0-.06.18a1.42 1.42 0 0 0 0 .2S7 12 7 12v.12a.65.65 0 0 0 .05.2a.89.89 0 0 0 .08.17a.86.86 0 0 0 .1.16l.16.13a.76.76 0 0 0 .09.09h.16A1 1 0 0 0 8 13h3.27l-1.45 2.5a1 1 0 0 0 1.74 1l2.31-4s.01-.04.02-.06ZM21 10a1 1 0 0 0-1 1v2a1 1 0 0 0 2 0v-2a1 1 0 0 0-1-1Zm-4-3h-2.69a1 1 0 0 0 0 2H17v6h-2.31a1 1 0 1 0 0 2H17a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"
      />
    </svg>
  );
}

export function BatteryCheck(props: SVGProps<SVGSVGElement>) {
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
        d="m16.75 21.16l-2.75-3L15.16 17l1.59 1.59L20.34 15l1.16 1.41l-4.75 4.75M12 18c0-3.31 2.69-6 6-6V5.33C18 4.6 17.4 4 16.67 4H15V2H9v2H7.33C6.6 4 6 4.6 6 5.33v15.34C6 21.4 6.6 22 7.33 22h6.21A5.93 5.93 0 0 1 12 18Z"
      />
    </svg>
  );
}
