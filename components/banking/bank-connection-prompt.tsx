"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, Zap, Shield, Globe } from "lucide-react";
import { BankConnectionModal } from "./bank-connection-modal";

interface BankConnectionPromptProps {
  className?: string;
  variant?: "card" | "banner" | "compact";
}

export function BankConnectionPrompt({ 
  className = "", 
  variant = "card" 
}: BankConnectionPromptProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleConnectionSuccess = () => {
    setIsModalOpen(false);
    // Optionally refresh the page or update parent component
    window.location.reload();
  };

  if (variant === "banner") {
    return (
      <>
        <div className={`bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-lg p-4 ${className}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Building2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-emerald-900">Connect Your Bank Account</h3>
                <p className="text-sm text-emerald-700">
                  Automatically import transactions from 12,000+ banks worldwide
                </p>
              </div>
            </div>
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Connect Bank
            </Button>
          </div>
        </div>
        <BankConnectionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleConnectionSuccess}
        />
      </>
    );
  }

  if (variant === "compact") {
    return (
      <>
        <Button 
          onClick={() => setIsModalOpen(true)}
          variant="outline"
          className={`border-emerald-200 hover:bg-emerald-50 ${className}`}
        >
          <Building2 className="h-4 w-4 mr-2" />
          Connect Bank
        </Button>
        <BankConnectionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleConnectionSuccess}
        />
      </>
    );
  }

  // Default card variant
  return (
    <>
      <Card className={`border-emerald-200 bg-gradient-to-br from-emerald-50 to-blue-50 ${className}`}>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center">
              <Building2 className="h-8 w-8 text-emerald-600" />
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">Connect Your Bank</h3>
              <p className="text-gray-600 mb-4">
                Automatically import transactions and keep your finances up to date
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 my-6">
              <div className="text-center">
                <div className="mx-auto w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                  <Zap className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-xs text-gray-600">Auto Import</div>
              </div>
              <div className="text-center">
                <div className="mx-auto w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mb-2">
                  <Shield className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="text-xs text-gray-600">Bank Security</div>
              </div>
              <div className="text-center">
                <div className="mx-auto w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
                  <Globe className="h-4 w-4 text-purple-600" />
                </div>
                <div className="text-xs text-gray-600">Global Banks</div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2 mb-4">
              <Badge variant="secondary" className="text-xs">🇺🇸 US Banks</Badge>
              <Badge variant="secondary" className="text-xs">🇪🇸 EU Banks</Badge>
              <Badge variant="secondary" className="text-xs">🇦🇷 LATAM Banks</Badge>
            </div>

            <Button 
              onClick={() => setIsModalOpen(true)}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Connect Your Bank
            </Button>
            
            <p className="text-xs text-gray-500">
              Your credentials are never stored. Bank-level security guaranteed.
            </p>
          </div>
        </CardContent>
      </Card>

      <BankConnectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleConnectionSuccess}
      />
    </>
  );
}