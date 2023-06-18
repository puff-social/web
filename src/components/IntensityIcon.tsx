import { ProfileIntensityMap } from "@puff-social/commons/dist/puffco";

interface Props {
  intensity: number;
  card?: boolean;
}

export function IntensityIcon(props: Props) {
  return props.card ? (
    <span className="flex mt-2 px-1 border border-black dark:border-white text-black dark:text-white items-center justify-center w-fit">
      <p className="text-xs px-1">{ProfileIntensityMap[props.intensity]}</p>
    </span>
  ) : (
    <span className="flex mt-2 px-1 rounded-lg bg-black text-white items-center justify-center w-fit">
      <p className="text-sm px-1">{ProfileIntensityMap[props.intensity]}</p>
    </span>
  );
}
