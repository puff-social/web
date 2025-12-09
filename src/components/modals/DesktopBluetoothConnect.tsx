import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  selectDesktopState,
  setBleConnectionModalOpen,
  setBluetoothConnecting,
  setBluetoothDevice,
  setBluetoothDevices,
} from "../../state/slices/desktop";
import { ChevronRight } from "../icons/Chevron";
import type { BluetoothDevice } from "electron";
import { useAppDispatch } from "../../state/store";

interface Props {}

export function DesktopBleConnectModal() {
  const desktop = useSelector(selectDesktopState);
  const dispatch = useAppDispatch();

  function registerHandlers() {
    if (typeof window != "undefined" && desktop.bluetoothConnectionModalOpen) {
      window.puffDesktop.bluetoothDeviceResults((event, devices) => {
        dispatch(setBluetoothDevices(devices));
      });
      window.puffDesktop.bluetoothPairingRequest((event, test) => {
        console.log(test, event);
      });
    }
  }

  useEffect(() => {
    if (desktop.bluetoothConnectionModalOpen) registerHandlers();
    else window?.puffDesktop?.clearEvents();
  }, [desktop.bluetoothConnectionModalOpen]);

  const connect = useCallback(async (device: BluetoothDevice) => {
    dispatch(setBluetoothDevice(device));
    dispatch(setBluetoothConnecting(true));
    window.puffDesktop.pairBluetoothDevice(device.deviceId);

    dispatch(setBleConnectionModalOpen(false));
    dispatch(setBluetoothDevices([]));
    window?.puffDesktop?.clearEvents();
  }, []);

  return (
    <Transition
      appear
      show={desktop.bluetoothConnectionModalOpen}
      as={Fragment}
    >
      <Dialog
        as="div"
        className="relative z-10"
        onClose={() => {
          dispatch(setBleConnectionModalOpen(false));
          dispatch(setBluetoothDevices([]));
          window?.puffDesktop?.cancelBluetoothRequest();
          window?.puffDesktop?.clearEvents();
        }}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-neutral-800 text-black dark:text-white p-6 text-left align-middle shadow-xl transition-all">
                <p className="font-bold m-1 mb-4 text-center">
                  Connect your Device
                </p>

                <div className="flex flex-col space-y-1">
                  {desktop.bluetoothDevices?.map((device: BluetoothDevice) => (
                    <div
                      key={device.deviceId}
                      className="flex flex-row p-2 bg-neutral-700/50 hover:bg-neutral-700 cursor-pointer rounded-md justify-between"
                      onClick={() => connect(device)}
                    >
                      <div className="flex flex-col space-y-1">
                        <p className="font-bold">{device.deviceName}</p>
                        <p className="opacity-50">{device.deviceId}</p>
                      </div>
                      <ChevronRight />
                    </div>
                  ))}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
