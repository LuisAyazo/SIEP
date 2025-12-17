import DashboardLayout from "../dashboard/layout";

export default function GroupsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}