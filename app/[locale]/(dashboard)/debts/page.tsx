"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { DebtSummary } from "@/components/debts/debt-summary";
import { DebtList } from "@/components/debts/debt-list";
import { DebtModal } from "@/components/debts/debt-modal";
import { DebtDetailView } from "@/components/debts/debt-detail-view";
import { type Debt } from "@/lib/db/schemas/debt";

export default function DebtsPage() {
  const t = useTranslations("debts");
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [currentView, setCurrentView] = useState<"list" | "detail">("list");

  const handleAddDebt = () => {
    setEditingDebt(null);
    setModalMode("create");
    setShowModal(true);
  };

  const handleEditDebt = (debt: Debt) => {
    setEditingDebt(debt);
    setModalMode("edit");
    setShowModal(true);
  };

  const handleViewDebt = (debt: Debt) => {
    setSelectedDebt(debt);
    setCurrentView("detail");
  };

  const handleBackToList = () => {
    setSelectedDebt(null);
    setCurrentView("list");
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDebt(null);
  };

  if (currentView === "detail" && selectedDebt) {
    return (
      <DebtDetailView
        debtId={selectedDebt.id}
        onBack={handleBackToList}
        onEdit={handleEditDebt}
      />
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("pageTitle")}</h1>
          <p className="text-muted-foreground">{t("pageDescription")}</p>
        </div>
      </div>

      {/* Debt Summary */}
      <DebtSummary />

      {/* Debt List */}
      <DebtList
        onAddDebt={handleAddDebt}
        onEditDebt={handleEditDebt}
        onViewDebt={handleViewDebt}
      />

      {/* Debt Modal */}
      <DebtModal
        open={showModal}
        onClose={handleCloseModal}
        debt={editingDebt}
        mode={modalMode}
      />
    </div>
  );
}