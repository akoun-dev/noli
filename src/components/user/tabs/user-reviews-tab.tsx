"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Star, Loader2, CheckCircle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

/* ── Types ── */
interface Insurer {
  id: number;
  name: string;
  logoUrl?: string | null;
}
interface Review {
  id: number;
  insurerId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  insurer?: Insurer | null;
}

/* ── Étoiles cliquables ── */
function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Note">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
          aria-checked={value === n}
          role="radio"
          className="p-0.5"
        >
          <Star
            className={`h-6 w-6 transition-colors ${
              (hover || value) >= n ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Note : ${rating} sur 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-4 w-4 ${rating >= n ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

/* ── Formulaire d'avis (création ou édition) ── */
function ReviewForm({
  insurer,
  initialRating = 0,
  initialComment = "",
  onDone,
}: {
  insurer: Insurer;
  initialRating?: number;
  initialComment?: string;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (rating < 1) {
      toast({ title: "Note requise", description: "Choisissez une note de 1 à 5 étoiles.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ insurerId: insurer.id, rating, comment }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erreur");
      }
      toast({ title: "Avis publié", description: `Merci d'avoir noté ${insurer.name}.` });
      onDone();
    } catch (e) {
      toast({
        title: "Erreur",
        description: e instanceof Error ? e.message : "Impossible d'enregistrer l'avis.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium">{insurer.name}</p>
        <StarInput value={rating} onChange={setRating} />
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="Partagez votre expérience (facultatif)…"
        className="w-full rounded-lg border bg-background p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      <div className="flex justify-end">
        <Button onClick={submit} disabled={saving} size="sm" className="bg-brand text-black hover:bg-brand-hover">
          {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <CheckCircle className="size-4 mr-2" />}
          Publier mon avis
        </Button>
      </div>
    </div>
  );
}

/* ── Onglet ── */
export function UserReviewsTab() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewable, setReviewable] = useState<Insurer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reviews");
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews ?? []);
        setReviewable(data.reviewableInsurers ?? []);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const onDone = () => {
    setEditing(null);
    fetchReviews();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  const nothing = reviews.length === 0 && reviewable.length === 0;

  return (
    <div className="space-y-6">
      <motion.div initial={{ y: 10 }} animate={{ y: 0 }} transition={{ duration: 0.4 }}>
        <h2 className="text-xl font-bold">Mes Avis</h2>
        <p className="text-muted-foreground text-sm mt-1">Partagez votre expérience avec les assureurs.</p>
      </motion.div>

      {nothing && (
        <div className="rounded-xl border border-dashed bg-card/40 p-10 text-center">
          <div className="rounded-full bg-gradient-to-br from-yellow-500/10 to-orange-500/10 p-4 mx-auto w-fit mb-4">
            <MessageSquare className="h-10 w-10 text-yellow-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Vous n&apos;avez pas encore d&apos;avis à laisser</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Demandez un devis à un assureur : vous pourrez ensuite noter et commenter votre expérience
            pour aider d&apos;autres utilisateurs.
          </p>
        </div>
      )}

      {/* Assureurs à noter */}
      {reviewable.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">À noter</h3>
          {reviewable.map((ins) => (
            <Card key={ins.id} className="rounded-xl border bg-card">
              <CardContent className="p-4 sm:p-5">
                <ReviewForm insurer={ins} onDone={onDone} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Avis déjà publiés */}
      {reviews.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Mes avis publiés</h3>
          {reviews.map((r) => {
            const insurer: Insurer = r.insurer || { id: r.insurerId, name: "Assureur" };
            return (
              <Card key={r.id} className="rounded-xl border bg-card">
                <CardContent className="p-4 sm:p-5">
                  {editing === r.insurerId ? (
                    <ReviewForm
                      insurer={insurer}
                      initialRating={r.rating}
                      initialComment={r.comment || ""}
                      onDone={onDone}
                    />
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">{insurer.name}</p>
                        <div className="flex items-center gap-3">
                          <StarDisplay rating={r.rating} />
                          <button
                            onClick={() => setEditing(r.insurerId)}
                            className="text-muted-foreground hover:text-primary"
                            aria-label="Modifier l'avis"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
