import DashboardLayout from "../dashboard/layout";

export default function RolesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}