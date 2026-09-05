import type { Metadata } from "next";
import TaskManager from "@/components/task-manager";

export const metadata: Metadata = {
  title: "إدارة المهام | رحلة مُنجِز",
  description: "مساحة رحلة مُنجِز لإدارة المهام اليومية ومتابعة الإنجازات والأهداف.",
};

export default function TasksPage() { return <TaskManager />; }
