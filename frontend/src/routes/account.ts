import { createContext } from "react";

export type Account = {
  email: string;
};

export const AccountContext = createContext<Account | null>(null);
