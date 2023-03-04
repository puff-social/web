import { SVGProps } from "react";

export function Bluetooth(props: SVGProps<SVGSVGElement>) {
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
        d="M17.71 7.71L12 2h-1v7.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L11 14.41V22h1l5.71-5.71l-4.3-4.29l4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88z"
      />
    </svg>
  );
}

export function BluetoothDisabled(props: SVGProps<SVGSVGElement>) {
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
        d="m13 5.83l1.88 1.88l-1.6 1.6l1.41 1.41l3.02-3.02L12 2h-1v5.03l2 2v-3.2zM5.41 4L4 5.41L10.59 12L5 17.59L6.41 19L11 14.41V22h1l4.29-4.29l2.3 2.29L20 18.59L5.41 4zM13 18.17v-3.76l1.88 1.88L13 18.17z"
      />
    </svg>
  );
}

export function BluetoothConnected(props: SVGProps<SVGSVGElement>) {
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
        d="m7 12l-2-2l-2 2l2 2l2-2zm10.71-4.29L12 2h-1v7.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L11 14.41V22h1l5.71-5.71l-4.3-4.29l4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88zM19 10l-2 2l2 2l2-2l-2-2z"
      />
    </svg>
  );
}
