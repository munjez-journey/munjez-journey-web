import type { Metadata } from "next";
import PlatformGate from "./PlatformGate";

export const metadata: Metadata = {
  title: "منصة مُنجِز الكاملة | رحلة مُنجِز",
  description: "المنصة الكاملة لإدارة المهام والأهداف والإنجازات والتقويم، مربوطة بحسابك.",
};

export default function PlatformPage() {
  return <PlatformGate />;
}
