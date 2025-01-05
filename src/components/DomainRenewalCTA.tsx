import { useEffect, useMemo, useState } from "react";
import { DonationModal } from "./modals/Donation";
import NoSSR from "./NoSSR";
import { formatRelativeTimeInDays } from "../utils/time";

const EXPIRY_DATE_EPOCH = 1738627200000;

export function DomainRenewalCTA() {
  const [donationsOpen, setDonationsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const expiry = useMemo(() => {
    return formatRelativeTimeInDays(currentDate, new Date(EXPIRY_DATE_EPOCH));
  }, [currentDate]);

  useEffect(() => {
    const int = setInterval(() => setCurrentDate(new Date()), 60_000);
    return () => clearInterval(int);
  }, []);

  return (
    <NoSSR>
      <div className="flex w-full" onClick={() => setDonationsOpen(true)}>
        <div className="flex w-full text-black dark:text-black bg-yellow-500 text-center justify-center text-lg py-1">
          <p>🚨</p>
          <p className="">
            The <span className="font-bold">puff.social</span> domain is due for
            renewal on <span className="font-bold">February 4th</span> ({expiry}
            ){" "}
            <span className="font-bold underline">
              Keep us around with your support!
            </span>
          </p>
          <p>🚨</p>
        </div>
      </div>

      <DonationModal
        from="renewal_cta"
        modalOpen={donationsOpen}
        setModalOpen={setDonationsOpen}
      />
    </NoSSR>
  );
}
