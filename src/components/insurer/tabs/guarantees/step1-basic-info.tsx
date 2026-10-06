"use client";

import { Dispatch, SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CoverageCategory, InsCatOption, Step1Data } from "./types";

interface Step1BasicInfoProps {
  step1: Step1Data;
  setStep1: Dispatch<SetStateAction<Step1Data>>;
  categories: CoverageCategory[];
  insuranceCategories: InsCatOption[];
}

/* Étape 1 du wizard : informations de base de la garantie */
export function Step1BasicInfo({ step1, setStep1, categories, insuranceCategories }: Step1BasicInfoProps) {
  return (
    <div className="space-y-4">
      <div className="w-full">
        <Label>Catégorie Produit</Label>
        <Select value={step1.insuranceCategoryId} onValueChange={(v) => setStep1({ ...step1, insuranceCategoryId: v })}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
          <SelectContent>
            {insuranceCategories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="w-full"><Label>Nom *</Label><Input className="w-full" value={step1.name} onChange={(e) => setStep1({ ...step1, name: e.target.value })} /></div>
      <div className="w-full"><Label>Description</Label><Textarea className="w-full" value={step1.description} onChange={(e) => setStep1({ ...step1, description: e.target.value })} rows={2} /></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="w-full">
          <Label>Cat. Garantie</Label>
          <Select value={step1.categoryId} onValueChange={(v) => setStep1({ ...step1, categoryId: v })}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full"><Label>Ordre d&apos;affichage</Label><Input className="w-full" type="number" value={step1.displayOrder} onChange={(e) => setStep1({ ...step1, displayOrder: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center justify-between h-full pt-6">
          <Label>Obligatoire</Label>
          <Switch checked={step1.isMandatory} onCheckedChange={(v) => setStep1({ ...step1, isMandatory: v })} />
        </div>
        <div className="flex items-center justify-between h-full pt-6">
          <Label>Optionnelle</Label>
          <Switch checked={step1.isOptional} onCheckedChange={(v) => setStep1({ ...step1, isOptional: v })} />
        </div>
      </div>
      <div className="w-full">
        <Label>Conditions d&apos;application</Label>
        <Textarea className="w-full" placeholder="Conditions d'application (optionnel)" rows={2} value={step1.conditions} onChange={(e) => setStep1({ ...step1, conditions: e.target.value })} />
      </div>
    </div>
  );
}
