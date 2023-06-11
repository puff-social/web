import { ProfileIntensityMap } from "@puff-social/commons/dist/puffco";

interface Props {
  intensity: number;
}

export function IntensityIcon(props: Props) {
  return (
    <span className="flex mt-2 px-1 border border-black dark:border-white text-black dark:text-white items-center justify-center w-fit">
      <p className="text-xs px-1">{ProfileIntensityMap[props.intensity]}</p>
    </span>
  );
}
