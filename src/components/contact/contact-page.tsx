"use client";

import { useState } from "react";
import { MapPin, Phone, Mail, Clock, Send, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const contactInfo = [
  {
    icon: MapPin,
    label: "Adresse",
    value: "Zone 4, Rue du Commerce, Abidjan, Côte d'Ivoire",
  },
  {
    icon: Phone,
    label: "Téléphone",
    value: "+225 27 00 00 00 00",
  },
  {
    icon: Mail,
    label: "Email",
    value: "contact@noli.ci",
  },
  {
    icon: Clock,
    label: "Horaires",
    value: "Lun - Ven : 8h - 18h",
  },
];

const subjects = [
  "Question générale",
  "Demande de devis",
  "Réclamation",
  "Partenariat",
];

export function ContactPage() {
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubjectChange(value: string) {
    setForm((prev) => ({ ...prev, subject: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name || !form.email || !form.subject || !form.message) {
      toast({
        title: "Champs manquants",
        description:
          "Veuillez remplir tous les champs obligatoires (*) avant d'envoyer.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    setSubmitting(false);

    toast({
      title: "Message envoyé !",
      description:
        "Merci pour votre message. Notre équipe vous répondra dans les plus brefs délais.",
    });

    setForm({ name: "", email: "", phone: "", subject: "", message: "" });
  }

  return (
    <main className="min-h-screen">
      {/* ─── Header ──────────────────────────────────────────── */}
      <section className="bg-[#E8F4F0] dark:bg-[#121e19] py-16 md:py-20">
        <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-accent/15 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-primary uppercase animate-fade-in-up">
            Contactez-nous
          </span>

          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl animate-slide-up">
            Une question ?{" "}
            <span className="text-primary">Parlons-en</span>
          </h1>

          <p className="mx-auto mt-4 max-w-xl font-subtitle text-base text-muted-foreground sm:text-lg animate-slide-up" style={{ animationDelay: "150ms" }}>
            Notre équipe est à votre écoute. Remplissez le formulaire ci-dessous
            et nous vous répondrons rapidement.
          </p>
        </div>
      </section>

      {/* ─── Two-Column Layout ───────────────────────────────── */}
      <section className="bg-background py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-5 lg:gap-16">
            {/* ─── Left: Form (3 cols) ─────────────────────── */}
            <div className="lg:col-span-3 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
              <form
                onSubmit={handleSubmit}
                className="space-y-5 rounded-xl border border-border/50 bg-card p-6 shadow-sm sm:p-8"
              >
                {/* Nom complet */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Nom complet <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Jean Kouamé"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full"
                  />
                </div>

                {/* Email + Téléphone */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="jean@exemple.com"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none">
                        🇨🇮 +225
                      </span>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="07 00 00 00"
                        value={form.phone}
                        onChange={handleChange}
                        className="w-full pl-20"
                      />
                    </div>
                  </div>
                </div>

                {/* Sujet */}
                <div className="space-y-2">
                  <Label htmlFor="subject">
                    Sujet <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.subject}
                    onValueChange={handleSubjectChange}
                  >
                    <SelectTrigger className="w-full" id="subject">
                      <SelectValue placeholder="Sélectionnez un sujet" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <Label htmlFor="message">
                    Message <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Décrivez votre demande..."
                    rows={5}
                    value={form.message}
                    onChange={handleChange}
                    className="w-full resize-none"
                  />
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 size-4" />
                      Envoyer le message
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* ─── Right: Contact Info (2 cols) ────────────── */}
            <div className="space-y-5 lg:col-span-2 animate-fade-in-up" style={{ animationDelay: "250ms" }}>
              <h2 className="font-display text-xl font-semibold text-foreground">
                Nos coordonnées
              </h2>
              <p className="font-subtitle text-sm text-muted-foreground">
                Vous pouvez également nous joindre directement par téléphone ou
                email.
              </p>

              <div className="space-y-4 pt-2">
                {contactInfo.map((info, i) => {
                  const Icon = info.icon;
                  return (
                    <div
                      key={info.label}
                      className="flex items-start gap-4 rounded-xl border border-border/50 bg-card p-4 shadow-sm transition-shadow duration-300 hover:shadow-md animate-fade-in-up"
                      style={{ animationDelay: `${300 + i * 80}ms` }}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {info.label}
                        </p>
                        <p className="mt-0.5 font-subtitle text-sm font-medium text-foreground">
                          {info.value}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
