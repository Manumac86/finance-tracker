import { AddTransactionButton } from "@/components/add-transaction-button";
import { Header } from "@/components/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-gray-950 text-gray-50 dark">
      <main className="flex-1 px-2 py-4 sm:px-4 sm:py-6 lg:px-6 max-w-full overflow-x-hidden">
        <Header />
        <div className="max-w-7xl mx-auto pt-6">
          {children}
        </div>
        <AddTransactionButton />
      </main>
    </div>
  );
}
