import DashboardLayout from "../dashboard/layout";

export default function SolicitudesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}