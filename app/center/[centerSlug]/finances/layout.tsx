import DashboardLayout from "../dashboard/layout";

export default function FinancesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}