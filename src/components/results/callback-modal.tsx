"use client";

import { useState, useEffect } from "react";
import { Phone, Clock, Loader2, Info } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { InsurerOffer } from "@/types";

const TIME_SLOTS = [
  { value: "matin", label: "Matin (8h - 12h)" },
  { value: "apres-midi", label: "Après-midi (14h - 18h)" },
  { value: "soir", label: "Soirée (18h - 20h)" },
];

export interface CallbackModalProps {
  open: boolean;
  onClose: () => void;
  offer: InsurerOffer | null;
  onSubmit: (phone: string, preferredTime: string) => Promise<void>;
}

export function CallbackModal({
  open,
  onClose,
  offer,
  onSubmit,
}: CallbackModalProps) {
  const { personalInfo } = useAppStore()
  const [phone, setPhone] = useState(personalInfo.phone || "")
  const [preferredTime, setPreferredTime] = useState("matin")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setPhone(personalInfo.phone || "")
      setPreferredTime("matin")
      setError("")
    }
  }, [open, personalInfo.phone])

  const handleSubmit = async () => {
    const trimmed = phone.trim()
    if (!trimmed) {
      setError("Veuillez saisir votre numéro de téléphone")
      return
    }
    if (trimmed.length < 8) {
      setError("Numéro de téléphone invalide")
      return
    }
    setSubmitting(true)
    setError("")
    try {
      await onSubmit(trimmed, preferredTime)
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && !submitting && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="size-5 text-primary" />
            Être rappelé
          </DialogTitle>
          <DialogDescription>
            {offer
              ? `Un conseiller ${offer.insurerName} vous rappellera gratuitement.`
              : "Un conseiller vous rappellera gratuitement."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Phone */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Votre numéro de téléphone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => {
                setPhone(e.target.value)
                setError("")
              }}
              placeholder="+225 01 02 03 04 05"
              className={`w-full rounded-lg border ${error ? "border-destructive" : "border-border"} bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all`}
              disabled={submitting}
              autoFocus
            />
            {error && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <Info className="size-3" />
                {error}
              </p>
            )}
          </div>

          {/* Time slot */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Créneau préféré
            </label>
            <div className="grid grid-cols-1 gap-2">
              {TIME_SLOTS.map(slot => (
                <button
                  key={slot.value}
                  type="button"
                  onClick={() => setPreferredTime(slot.value)}
                  disabled={submitting}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-all duration-200 ${
                    preferredTime === slot.value
                      ? "border-primary bg-primary/5 text-primary font-semibold ring-1 ring-primary/30"
                      : "border-border/60 text-foreground hover:border-primary/40 hover:bg-muted/20"
                  }`}
                >
                  <Clock
                    className={`size-4 shrink-0 ${
                      preferredTime === slot.value
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                  {slot.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1 rounded-lg"
            onClick={onClose}
            disabled={submitting}
          >
            Annuler
          </Button>
          <Button
            className="flex-1 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Phone className="size-4 mr-2" />
                Envoyer
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
