import { PuffLogo } from "../assets/Logo";

export default function Maintenance() {
  return (
    <div className="flex flex-col justify-center items-center h-screen space-y-4 mx-6">
      <PuffLogo className="h-28 w-28 text-black dark:text-white transition-all" />
      <h1 className="text-2xl">We're performing maintenance</h1>
      <p className="text-lg text-wrap lg:w-2/5 md:w-1/2 text-center">
        Don't worry we'll be right back, we're just moving around some servers
        and getting things ready to come back online.
      </p>
      <p className="opacity-50">- Dustin</p>
    </div>
  );
}
