import { Fragment, useCallback, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useDispatch, useSelector } from "react-redux";

import {
  selectUIState,
  setEditingProfile,
  setEditingProfileIndex,
  setProfileModalOpen,
} from "../../state/slices/ui";
import { Device } from "../../utils/puffco";
import "../../utils/functions";
import toast from "react-hot-toast";
import {
  Characteristic,
  DynamicLoraxCharacteristics,
  MAX_INTENSITY,
  MinimumFirmwareMap,
  PROFILE_TEMPERATURE_MIN,
  ProfileIntensityMap,
  TEMPERATURE_MAX,
  XL_INTENSITY,
  meetsMinimumFirmware,
} from "@puff-social/commons/dist/puffco";
import { Tippy } from "../Tippy";

interface Props {
  instance: Device;
}

export function ProfileEditModal({ instance }: Readonly<Props>) {
  const ui = useSelector(selectUIState);
  const dispatch = useDispatch();

  const [profileName, setProfileName] = useState<string>();
  const [profileIntensity, setProfileIntensity] = useState<number>();
  const [profileTemperature, setProfileTemperature] = useState<number>();
  const [profileTime, setProfileTime] = useState<string>();

  const updateProfile = useCallback(async () => {
    if (!ui.editingProfile) return;

    if (profileName != ui.editingProfile.name) {
      await instance.openPath(
        DynamicLoraxCharacteristics[Characteristic.PROFILE_NAME](
          ui.editingProfileIndex - 1
        ),
        4
      );
      const buf = Buffer.from(profileName);
      await instance.sendLoraxValueShort(
        DynamicLoraxCharacteristics[Characteristic.PROFILE_NAME](
          ui.editingProfileIndex - 1
        ),
        buf
      );
      await instance.closePath(
        DynamicLoraxCharacteristics[Characteristic.PROFILE_NAME](
          ui.editingProfileIndex - 1
        )
      );
    }

    if (profileTemperature != ui.editingProfile.temp) {
      const buf = Buffer.alloc(4);
      buf.writeFloatLE((profileTemperature - 32) * (5 / 9));
      await instance.sendLoraxValueShort(
        DynamicLoraxCharacteristics[Characteristic.PROFILE_PREHEAT_TEMP](
          ui.editingProfileIndex - 1
        ),
        buf
      );
    }

    if (profileIntensity != ui.editingProfile.intensity) {
      const buf = Buffer.alloc(4);
      buf.writeFloatLE(profileIntensity);
      await instance.sendLoraxValueShort(
        DynamicLoraxCharacteristics.PROFILE_INTENSITY(
          ui.editingProfileIndex - 1
        ),
        buf
      );
    }

    toast("Updated profile", { position: "top-right", duration: 1000 });
    await instance.loraxProfiles();

    dispatch(setProfileModalOpen(false));
    dispatch(setEditingProfile(null));
    dispatch(setEditingProfileIndex(null));
  }, [profileName, profileTemperature, profileIntensity, profileTime]);

  useEffect(() => {
    if (ui.editingProfile) {
      setProfileName(ui.editingProfile.name.toString());
      setProfileIntensity(ui.editingProfile.intensity);
      setProfileTemperature(ui.editingProfile.temp * (9 / 5) + 32);
      setProfileTime(ui.editingProfile.time);
    }
  }, [ui.editingProfile]);

  return (
    <Transition appear show={ui.profileEditModalOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-10"
        onClose={() => {
          dispatch(setProfileModalOpen(false));
          dispatch(setEditingProfile(null));
          dispatch(setEditingProfileIndex(null));
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-neutral-800 text-black dark:text-white p-6 text-left align-middle shadow-xl transition-all">
                <p className="font-bold m-1 text-center">
                  Profile "{profileName}"
                </p>
                <span className="flex flex-col space-y-2">
                  <span>
                    <p className="font-bold">Profile Name</p>
                    <input
                      value={profileName}
                      placeholder="Profile name"
                      maxLength={29}
                      className="w-full rounded-md p-2 mb-2 border-2 border-slate-300 text-black"
                      onChange={({ target: { value } }) =>
                        setProfileName(value)
                      }
                    />
                  </span>

                  <span className="flex justify-between items-center">
                    <p className="font-bold opacity-60 self-center">
                      Color, Mood, and Time controls coming soon!
                    </p>
                  </span>

                  <span className="flex justify-between items-center">
                    <p className="font-bold">
                      Temperature
                      <p className="font-bold pl-1">{profileTemperature}° F</p>
                    </p>

                    <span className="flex flex-row items-center justify-center">
                      <input
                        type="range"
                        min={PROFILE_TEMPERATURE_MIN}
                        max={TEMPERATURE_MAX}
                        value={profileTemperature}
                        onChange={({ target: { value } }) =>
                          setProfileTemperature(Number(value))
                        }
                      />
                    </span>
                  </span>

                  {meetsMinimumFirmware(
                    instance.deviceFirmware,
                    MinimumFirmwareMap.VAPOR_SETTING
                  ) ? (
                    <span className="flex justify-between items-center">
                      <p className="font-bold">Vapor Control</p>

                      <span className="flex flex-row items-center justify-center">
                        {Object.keys(ProfileIntensityMap)
                          .filter(
                            (key) =>
                              Number(key) <=
                              (meetsMinimumFirmware(
                                instance.deviceFirmware,
                                MinimumFirmwareMap.XL_CHAMBER
                              )
                                ? XL_INTENSITY
                                : MAX_INTENSITY)
                          )
                          .sort((a, b) => Number(a) - Number(b))
                          .map((key) => (
                            <p
                              key={key}
                              className={`${
                                profileIntensity == Number(key)
                                  ? "bg-neutral-400 dark:bg-neutral-800"
                                  : "bg-neutral-300 dark:bg-black"
                              } hover:bg-neutral-400 hover:dark:bg-neutral-800 select-none cursor-pointer p-1 px-2 border border-0.5 border-white/30 first:rounded-l-md last:rounded-r-md`}
                              onClick={() => setProfileIntensity(Number(key))}
                            >
                              {ProfileIntensityMap[key]}
                            </p>
                          ))}
                      </span>
                    </span>
                  ) : (
                    <></>
                  )}
                </span>

                <button
                  className="w-full self-center rounded-md bg-indigo-600 hover:bg-indigo-700 p-1 mt-3 text-white"
                  onClick={() => updateProfile()}
                >
                  Save
                </button>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
