"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { usePaginationClamp } from "@/components/shared/pagination-controls";
import { PAGE_SIZE, calcLabel, emptyStep1 } from "./constants";
import { getDefaultVehicleCategories } from "./defaults";
import { buildCoveragePayload } from "./build-payload";
import { useGuaranteesData } from "./use-guarantees-data";
import { parseWizardStateFromItem } from "./parse-wizard-state";
import type {
  Coverage,
  CalculationType,
  Step1Data,
  MatrixTariff,
  FormulaConfig,
  CategoryTariff,
} from "./types";

/* Hook d'orchestration du wizard de garanties assureur */
export function useGuaranteesWizard() {
  const { toast } = useToast();
  const {
    insurerId,
    coverages,
    categories,
    insuranceCategories,
    loading,
    error,
    refreshData,
  } = useGuaranteesData();

  // Wizard state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Coverage | null>(null);
  const [step, setStep] = useState(1);
  const [step1, setStep1] = useState<Step1Data>(emptyStep1);
  const [calcType, setCalcType] = useState<CalculationType | "">("");
  const [metadata, setMetadata] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);

  // Matrix states (aligned with admin)
  const [matrixTariffs, setMatrixTariffs] = useState<MatrixTariff[]>([]);
  const [matrixFormulas, setMatrixFormulas] = useState<FormulaConfig[]>([]);
  const [matrixDefaultPrime, setMatrixDefaultPrime] = useState<number>(0);
  const [matrixDimension, setMatrixDimension] = useState<string>("FISCAL_POWER");
  const [categoryTariffs, setCategoryTariffs] = useState<CategoryTariff[]>([]);
  const [tierceVehicleCategory, setTierceVehicleCategory] = useState<string>("401");
  const [tierceCategories, setTierceCategories] = useState<string[]>(getDefaultVehicleCategories());
  const [newCategoryInput, setNewCategoryInput] = useState("");

  // Search / filter (client-side → pagination en mémoire sur le résultat filtré)
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const filteredCoverages = coverages.filter((cov) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      cov.name.toLowerCase().includes(q) ||
      cov.code?.toLowerCase().includes(q) ||
      (cov.category?.name || "").toLowerCase().includes(q) ||
      (calcLabel[cov.calculationType] || "").toLowerCase().includes(q) ||
      (cov.isMandatory ? "oui" : "non").includes(q) ||
      (cov.isActive ? "active" : "inactive").includes(q)
    );
  });
  const pageCount = Math.max(1, Math.ceil(filteredCoverages.length / PAGE_SIZE));
  usePaginationClamp(page, setPage, pageCount);
  const pagedCoverages = filteredCoverages.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  // Reset à la page 1 dès que la recherche change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Coverage | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ── Wizard ── */
  const resetWizard = () => {
    setStep1(emptyStep1);
    setCalcType("");
    setMetadata({});
    setMatrixTariffs([]);
    setMatrixFormulas([]);
    setMatrixDefaultPrime(0);
    setMatrixDimension("FISCAL_POWER");
    setCategoryTariffs([]);
    setTierceVehicleCategory("401");
    setTierceCategories(getDefaultVehicleCategories());
    setNewCategoryInput("");
    setStep(1);
  };

  const openCreate = () => {
    setEditingItem(null);
    resetWizard();
    setDialogOpen(true);
  };

  const openEdit = (item: Coverage) => {
    setEditingItem(item);
    const parsed = parseWizardStateFromItem(item, insuranceCategories);
    setStep1(parsed.step1);
    setCalcType(parsed.calcType);
    setMetadata(parsed.metadata);
    setMatrixDimension(parsed.matrixDimension);
    setMatrixDefaultPrime(parsed.matrixDefaultPrime);
    setMatrixTariffs(parsed.matrixTariffs);
    setMatrixFormulas(parsed.matrixFormulas);
    setCategoryTariffs(parsed.categoryTariffs);
    setTierceVehicleCategory(parsed.tierceVehicleCategory);
    setTierceCategories(parsed.tierceCategories);
    setStep(1);
    setDialogOpen(true);
  };

  /* ── Save ── */
  const handleSave = async () => {
    if (!step1.name.trim()) {
      toast({ title: "Erreur", description: "Le nom de la garantie est requis", variant: "destructive" });
      return;
    }
    if (!insurerId) {
      toast({ title: "Erreur", description: "Compte assureur non trouvé. Impossible de créer la garantie.", variant: "destructive" });
      return;
    }
    if (!calcType) {
      toast({ title: "Erreur", description: "Le mode de calcul est requis (étape 2)", variant: "destructive" });
      return;
    }
    setSaving(true);

    const payload = buildCoveragePayload({
      calcType,
      metadata,
      insurerId,
      step1,
      insuranceCategories,
      matrixDimension,
      matrixDefaultPrime,
      matrixTariffs,
      matrixFormulas,
      categoryTariffs,
    });

    try {
      const url = editingItem
        ? `/api/insurer/coverages/${editingItem.id}`
        : "/api/insurer/coverages";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur");
      }

      toast({
        title: editingItem ? "Garantie mise à jour" : "Garantie créée",
        description: editingItem
          ? `"${step1.name}" a été modifiée.`
          : `"${step1.name}" a été ajoutée à vos garanties.`,
      });

      setDialogOpen(false);
      await refreshData();
    } catch (e) {
      toast({
        title: "Erreur",
        description: e instanceof Error ? e.message : "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/insurer/coverages/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast({
        title: "Garantie supprimée",
        description: `"${deleteTarget.name}" a été désactivée.`,
      });
      setDeleteTarget(null);
      await refreshData();
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la garantie",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return {
    // Data
    insurerId,
    coverages,
    categories,
    insuranceCategories,
    loading,
    error,
    // Wizard
    dialogOpen,
    setDialogOpen,
    editingItem,
    step,
    setStep,
    step1,
    setStep1,
    calcType,
    setCalcType,
    metadata,
    setMetadata,
    saving,
    // Matrix
    matrixTariffs,
    setMatrixTariffs,
    matrixFormulas,
    setMatrixFormulas,
    matrixDefaultPrime,
    setMatrixDefaultPrime,
    matrixDimension,
    setMatrixDimension,
    categoryTariffs,
    setCategoryTariffs,
    tierceVehicleCategory,
    setTierceVehicleCategory,
    tierceCategories,
    setTierceCategories,
    newCategoryInput,
    setNewCategoryInput,
    // Search / pagination
    searchQuery,
    page,
    setPage,
    filteredCoverages,
    pageCount,
    pagedCoverages,
    handleSearchChange,
    // Delete
    deleteTarget,
    setDeleteTarget,
    deleting,
    // Actions
    openCreate,
    openEdit,
    handleSave,
    handleDelete,
  };
}
