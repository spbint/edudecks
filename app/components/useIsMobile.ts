"use client";

import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 820;

export default function useIsMobile(breakpoint = MOBILE_BREAKPOINT) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function update() {
      setIsMobile(window.innerWidth <= breakpoint);
    }

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [breakpoint]);

  return isMobile;
}
