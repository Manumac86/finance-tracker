import { AddTransactionButton } from "@/components/add-transaction-button";
import { AppSidebar } from "@/components/app-sidebar";
import { TopBar } from "@/components/top-bar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <TopBar />
        <div className="flex flex-1 flex-col p-4">
          {children}
          <AddTransactionButton />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
