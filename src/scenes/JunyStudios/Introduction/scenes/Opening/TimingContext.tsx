import { createContext, useContext } from "react";
import { STANDARD_TIMING, type OpeningTiming } from "./timing";

// Which timing set (standard or short) the Opening scene is rendering with.
export const OpeningTimingContext =
  createContext<OpeningTiming>(STANDARD_TIMING);

export const useOpeningTiming = () => useContext(OpeningTimingContext);
