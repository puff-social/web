import type { BluetoothDevice, IpcRendererEvent } from "electron";

declare global {
  interface Window {
    puffDesktop: {
      cancelBluetoothRequest: () => void;
      bluetoothPairingRequest: (
        callback: (event: IpcRendererEvent, details: any) => void
      ) => void;
      bluetoothDeviceResults: (
        callback: (event: IpcRendererEvent, devices: BluetoothDevice[]) => void
      ) => void;
      bluetoothPairingResponse: (deviceId: string) => void;
      clearEvents: () => void;
      pairBluetoothDevice: (deviceId: string) => void;
    };
  }
}
