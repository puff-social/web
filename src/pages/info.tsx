import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import { MainMeta } from "../components/MainMeta";
import { InfoModal } from "../components/modals/Info";

export default function Info(props) {
  const router = useRouter();

  const [modalOpen, setModalOpen] = useState(true);

  const [firstVisit] = useState(() =>
    typeof localStorage != "undefined"
      ? localStorage.getItem("puff-social-first-visit") != "false"
      : false
  );

  useEffect(() => {
    if (firstVisit) {
      if (typeof window.localStorage != "undefined")
        window.localStorage.setItem("puff-social-first-visit", "false");
    }
  }, []);

  useEffect(() => {
    if (typeof modalOpen == "boolean" && !modalOpen) router.push("/");
  }, [modalOpen]);

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

      <InfoModal setModalOpen={setModalOpen} modalOpen={modalOpen} />

      <div />
    </div>
  );
}
