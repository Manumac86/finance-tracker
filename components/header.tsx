import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DollarSign, Search, Plus } from "lucide-react";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-800 bg-gray-950/95 px-4 backdrop-blur-sm sm:px-6">
      <Link href="#" className="flex items-center gap-2 font-semibold">
        <DollarSign className="h-6 w-6 text-emerald-500" />
        <span>FinTrack</span>
      </Link>
      <div className="ml-auto flex items-center gap-4">
        <form className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search transactions..."
            className="w-64 rounded-lg bg-gray-900 pl-8 text-sm ring-offset-gray-950 placeholder:text-gray-500 focus-visible:ring-gray-800"
          />
        </form>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1 border-gray-800 bg-gray-950 text-gray-50 hover:bg-gray-900 hover:text-gray-50"
        >
          <Plus className="h-4 w-4" />
          <span>Add Transaction</span>
        </Button>
      </div>
    </header>
  );
}
