"use client";

import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useGuaranteesWizard } from "./guarantees/use-guarantees-wizard";
import { GuaranteesTable } from "./guarantees/guarantees-table";
import { GuaranteeWizardDialog } from "./guarantees/guarantee-wizard-dialog";

/* ── Composant ── */
export function InsurerGuaranteesTab() {
  const w = useGuaranteesWizard();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Mes Garanties</h2>
          <p className="text-muted-foreground mt-1">
            Gérez les garanties et couvertures proposées dans vos offres.
          </p>
        </div>
        <Button
          className="bg-brand text-black hover:bg-brand-hover"
          onClick={w.openCreate}
          disabled={!w.insurerId}
        >
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une garantie
        </Button>
      </div>

      {/* Guarantees table */}
      <GuaranteesTable
        loading={w.loading}
        error={w.error}
        coverages={w.coverages}
        filteredCoverages={w.filteredCoverages}
        pagedCoverages={w.pagedCoverages}
        searchQuery={w.searchQuery}
        handleSearchChange={w.handleSearchChange}
        page={w.page}
        pageCount={w.pageCount}
        setPage={w.setPage}
        openEdit={w.openEdit}
        setDeleteTarget={w.setDeleteTarget}
      />

      {/* ── Wizard Dialog ── */}
      <GuaranteeWizardDialog
        dialogOpen={w.dialogOpen}
        setDialogOpen={w.setDialogOpen}
        editingItem={w.editingItem}
        step={w.step}
        setStep={w.setStep}
        step1={w.step1}
        setStep1={w.setStep1}
        calcType={w.calcType}
        setCalcType={w.setCalcType}
        metadata={w.metadata}
        setMetadata={w.setMetadata}
        saving={w.saving}
        handleSave={w.handleSave}
        categories={w.categories}
        insuranceCategories={w.insuranceCategories}
        coverages={w.coverages}
        matrixDimension={w.matrixDimension}
        setMatrixDimension={w.setMatrixDimension}
        matrixTariffs={w.matrixTariffs}
        setMatrixTariffs={w.setMatrixTariffs}
        matrixFormulas={w.matrixFormulas}
        setMatrixFormulas={w.setMatrixFormulas}
        matrixDefaultPrime={w.matrixDefaultPrime}
        setMatrixDefaultPrime={w.setMatrixDefaultPrime}
        categoryTariffs={w.categoryTariffs}
        setCategoryTariffs={w.setCategoryTariffs}
        tierceVehicleCategory={w.tierceVehicleCategory}
        setTierceVehicleCategory={w.setTierceVehicleCategory}
        tierceCategories={w.tierceCategories}
        setTierceCategories={w.setTierceCategories}
        newCategoryInput={w.newCategoryInput}
        setNewCategoryInput={w.setNewCategoryInput}
      />

      {/* ── Delete Confirmation ── */}
      <AlertDialog
        open={!!w.deleteTarget}
        onOpenChange={(open) => !open && w.setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette garantie ?</AlertDialogTitle>
            <AlertDialogDescription>
              La garantie &quot;{w.deleteTarget?.name}&quot; ({w.deleteTarget?.code})
              sera désactivée. Elle ne sera plus disponible dans vos offres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={w.deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={w.handleDelete}
              disabled={w.deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {w.deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
