"use client";

import { useEffect, useState, useCallback } from "react";
import { useAppStore } from "@/store/app-store";
import type { Coverage, CoverageCategory, InsCatOption } from "./types";

/* Chargement des données de l'onglet garanties (compte, garanties, catégories) */
export function useGuaranteesData() {
  const { user } = useAppStore();

  const [insurerId, setInsurerId] = useState<string | null>(null);
  const [coverages, setCoverages] = useState<Coverage[]>([]);
  const [categories, setCategories] = useState<CoverageCategory[]>([]);
  const [insuranceCategories, setInsuranceCategories] = useState<InsCatOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsurer = useCallback(async () => {
    try {
      const res = await fetch(`/api/insurer/account`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setInsurerId(data.id);
      return data.id;
    } catch {
      setError("Impossible de charger votre compte assureur");
      return null;
    }
  }, []);

  const fetchCoverages = useCallback(async () => {
    try {
      const res = await fetch(`/api/insurer/coverages`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCoverages(data.coverages || []);
    } catch {
      setError("Erreur lors du chargement des garanties");
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/insurer/coverage-categories");
      if (!res.ok) return;
      const data = await res.json();
      setCategories(data);
    } catch {
      /* ignore */
    }
  }, []);

  const fetchInsuranceCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/insurer/insurance-categories");
      if (!res.ok) return;
      const data = await res.json();
      setInsuranceCategories(data);
    } catch {
      /* ignore */
    }
  }, []);

  const refreshData = useCallback(async () => {
    if (!insurerId) return;
    await fetchCoverages();
  }, [insurerId, fetchCoverages]);

  useEffect(() => {
    if (!user.id) {
      setLoading(false);
      return;
    }
    (async () => {
      const iid = await fetchInsurer();
      if (iid) await fetchCoverages();
      await Promise.all([fetchCategories(), fetchInsuranceCategories()]);
      setLoading(false);
    })();
  }, [user.id]);

  return {
    insurerId,
    coverages,
    categories,
    insuranceCategories,
    loading,
    error,
    refreshData,
  };
}
