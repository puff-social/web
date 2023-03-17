import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import { MainMeta } from "../components/MainMeta";

export default function Info() {
  const router = useRouter();

  const [firstVisit] = useState(() =>
    typeof localStorage != "undefined"
      ? localStorage.getItem("puff-social-first-visit") != "false"
      : true
  );

  useEffect(() => {
    if (firstVisit) {
      if (typeof window.localStorage != "undefined")
        window.localStorage.setItem("puff-social-first-visit", "false");
    }
  }, []);

  return (
    <div className="flex flex-col justify-between h-screen">
      <MainMeta pageName="Info" />

      <div
        className="flex flex-col m-4 z-10 cursor-pointer"
        onClick={() => router.push("/")}
      >
        <h1 className="text-4xl font-bold">puff.social</h1>
        <h3 className="text font-bold">
          by&nbsp;
          <a href="https://dstn.to" target="_blank">
            dstn.to
          </a>
          &nbsp;(idea by Roberto)
        </h3>
      </div>

      <div className="flex flex-col space-y-8 m-4 pb-16">
        <div className="flex flex-col rounded-md space-y-3 justify-center">
          <p className="w-[700px]">
            <span className="font-bold">Important:</span> This should work with
            any device running firmware X or later, and has been validated to
            work with firmware{" "}
            <span className="font-bold text-teal-100 bg-gray-700 px-1 rounded-md">
              Y
            </span>{" "}
            and{" "}
            <span className="font-bold text-teal-100 bg-gray-700 px-1 rounded-md">
              AA
            </span>
          </p>
          <p className="w-[700px]">
            <span className="font-bold">Also Important:</span> This will only
            work on browsers that support the Bluetooth API, so most likely if
            you don't use Google Chrome, you're probably only here to watch.
            (iOS can use the Path Browser, however it's fairly slow and there is
            a better option in the works soon)
          </p>

          <img className="w-96 rounded-md" src="/puff.webp" />
          <p className="w-[700px]">
            I decided to build this because A friend of mine and I smoke a lot
            over discord, we both have a peak pro, and while not super easy it
            is possible to interact with the device functions over BLE initially
            started by digging through the react native bundle for the official
            web app, and after getting pretty far, I found this{" "}
            <a
              href="https://github.com/Fr0st3h/Puffco-Reverse-Engineering-Writeup"
              className="text-blue-700 dark:text-blue-400"
              target="_blank"
            >
              writeup
            </a>
            , which helped better understand the characteristics and what they
            do, plus all the other obscure things you can do, along with that I
            just love realtime applications, so I built a{" "}
            <a
              className="text-blue-700 dark:text-blue-400"
              target="_blank"
              href="https://github.com/dustinrouillard/puffsocial-gateway"
            >
              socket server
            </a>{" "}
            in elixir to facilitate the synchronization, and threw together a
            rudimentary web app to allow us to sync our dab sessions with
            multiple people.
          </p>

          <p className="w-[700px]">
            After many iterations and plenty of bugs made and then fixed, I'm
            making this ready for anyone to use. You can set your public display
            name in user settings (separate from the device name, which is only
            used on the leaderboards)
          </p>

          <p className="w-[700px]">
            If you encounter any issues, let me know on discord (Dustin#1999
            find me in the server below for dm) or Twitter (
            <a
              className="text-blue-700 dark:text-blue-400"
              href="https://twitter.com/dustinrouillard"
              target="_blank"
            >
              @dustinrouillard
            </a>
            )
          </p>

          <p className="w-[700px]">
            Join my{" "}
            <a
              className="text-blue-700 dark:text-blue-400"
              target="_blank"
              href="https://dstn.to/fnf"
            >
              discord server
            </a>
            , maybe we can sesh sometime :)
          </p>

          <p className="w-[700px] flex flex-col">
            The source for the application and server side code is open, you can
            find the various repositories below.
            <span className="pt-1">
              Web:{" "}
              <a
                className="text-blue-700 dark:text-blue-400"
                target="_blank"
                href="https://github.com/dustinrouillard/puffsocial-web"
              >
                dustinrouillard/puffsocial-web
              </a>
            </span>
            <span>
              Realtime Server:{" "}
              <a
                className="text-blue-700 dark:text-blue-400"
                target="_blank"
                href="https://github.com/dustinrouillard/puffsocial-gateway"
              >
                dustinrouillard/puffsocial-gateway
              </a>
            </span>
            <span>
              Analytics Tracking:{" "}
              <a
                className="text-blue-700 dark:text-blue-400"
                target="_blank"
                href="https://github.com/dustinrouillard/puffsocial-analytics"
              >
                dustinrouillard/puffsocial-analytics
              </a>
            </span>
          </p>

          <p className="w-[700px] italic text-xs">
            If you're reading this and work at Puffco, I just want to give cool
            tools to the community, would love to see a group sesh feature in
            the app (maybe we can chat about that) :)
          </p>
        </div>
        <button
          className="bg-blue-500 p-8 rounded-md w-96 mt-8 text-black dark:text-white"
          onClick={() => router.push("/")}
        >
          Enter puff.social
        </button>
      </div>

      <div />
    </div>
  );
}
