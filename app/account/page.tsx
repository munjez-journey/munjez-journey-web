import type { Metadata } from "next";
import AccountGate from "./AccountGate";

export const metadata: Metadata = {
  title: "حسابي | رحلة مُنجِز",
  description: "إعجاباتك ومحفوظاتك في رحلة مُنجِز.",
};

export default function AccountPage() {
  return <AccountGate />;
}
