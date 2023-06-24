import { useEffect, useState } from "react";

function useDetectiOS(): boolean {
  const [isiOS, setIsiOS] = useState(false);

  useEffect(() => {
    if (typeof window != "undefined") {
      const userAgent = window.navigator.userAgent;
      setIsiOS(
        /iPad|iPhone|iPod/.test(userAgent) && !(window as any)?.MSStream
      );
    }
  }, []);

  return isiOS;
}

export default useDetectiOS;
