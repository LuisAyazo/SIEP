import DashboardLayout from "../dashboard/layout";

export default function MeetingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}