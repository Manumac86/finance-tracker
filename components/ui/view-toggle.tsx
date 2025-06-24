"use client";

import { Button } from "@/components/ui/button";
import { User, Users, Eye } from "lucide-react";

interface ViewToggleProps {
  currentView: "individual" | "family";
  onViewChange: (view: "individual" | "family") => void;
  showFamilyOption?: boolean;
  className?: string;
}

export function ViewToggle({ 
  currentView, 
  onViewChange, 
  showFamilyOption = true,
  className = ""
}: ViewToggleProps) {
  if (!showFamilyOption) {
    return null;
  }

  return (
    <div className={`flex items-center gap-1 p-1 bg-gray-800 rounded-lg ${className}`}>
      <Button
        variant={currentView === "individual" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("individual")}
        className="gap-2 h-8 text-xs"
      >
        <User className="h-4 w-4" />
        Individual
      </Button>
      <Button
        variant={currentView === "family" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("family")}
        className="gap-2 h-8 text-xs"
      >
        <Users className="h-4 w-4" />
        Family
      </Button>
    </div>
  );
}

export function ViewModeIndicator({ 
  currentView, 
  familyName 
}: { 
  currentView: "individual" | "family";
  familyName?: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-400">
      <Eye className="h-4 w-4" />
      <span>
        Viewing: {currentView === "family" ? (familyName || "Family") : "Individual"} data
      </span>
    </div>
  );
}