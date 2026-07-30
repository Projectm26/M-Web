import { createContext } from "react";

export interface SupportContextValue {
  supportNumber: string;
  setSupportNumber: (n: string) => void;
}

export const SupportContext = createContext<SupportContextValue | null>(null);
