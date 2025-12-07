import { AuditLog } from "@puff-social/commons/dist/puffco";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Device } from "../../utils/puffco";
import { Cross } from "../icons/Cross";
import { selectCurrentDeviceState } from "../../state/slices/device";
import { DeviceLogEntry } from "../DeviceLogEntry";
import { dismissBadge, selectUIState } from "../../state/slices/ui";

interface Props {
  instance: Device;
  modalOpen: boolean;
  setModalOpen: Function;
}

export function DeviceLogsModal({ instance, modalOpen, setModalOpen }: Props) {
  const currentDevice = useSelector(selectCurrentDeviceState);
  const ui = useSelector(selectUIState);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!ui.dismissedBadges.includes("deviceLogDisplay") && modalOpen)
      dispatch(dismissBadge("deviceLogDisplay"));
  }, [modalOpen]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  return (
    <Transition appear show={modalOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={() => closeModal()}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-neutral-800 text-black dark:text-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-2">
                  <h1 className="text-xl">Device Logs</h1>

                  <Cross
                    className="opacity-50 hover:opacity-100"
                    onClick={() => closeModal()}
                  />
                </div>

                <div className="flex flex-col space-y-2 rounded-md h-96 overflow-y-scroll">
                  {currentDevice.auditLogs &&
                  currentDevice.auditLogs.length > 0 ? (
                    [...currentDevice.auditLogs]
                      .sort((a: AuditLog, b: AuditLog) => b.id - a.id)
                      .slice(0, 200)
                      .map((item: AuditLog) => (
                        <div className="pr-2" key={item.id}>
                          <DeviceLogEntry entry={item} />
                        </div>
                      ))
                  ) : currentDevice.auditLogs ? (
                    <div className="flex justify-center items-center h-48">
                      <h1 className="text-md font-bold">
                        For some reason we failed to pull audit logs from your
                        device, try again?
                      </h1>
                    </div>
                  ) : (
                    <div className="flex justify-center items-center h-48">
                      <h1 className="text-lg font-bold">
                        Loading logs from Device
                      </h1>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
