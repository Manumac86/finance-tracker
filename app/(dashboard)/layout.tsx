import { AddTransactionButton } from "@/components/add-transaction-button";
import { Header } from "@/components/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-gray-950 text-gray-50 dark">
      <main className="flex-1 p-4 sm:p-6">
        <Header />
        {children}
        <AddTransactionButton />
      </main>
    </div>
  );
}
