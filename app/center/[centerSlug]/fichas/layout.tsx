import DashboardLayout from "../dashboard/layout";

export default function FichasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}