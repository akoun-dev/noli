"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAppStore } from "@/store/app-store";
import {
  LoginForm,
  RegisterForm,
  ForgotPasswordForm,
} from "./auth-form";

/* ── Main Auth Modals Export ── */
export function AuthModals() {
  const { authModal, setAuthModal } = useAppStore();
  const isOpen = authModal !== "none";

  const modalConfig: Record<
    string,
    { title: string; description: string }
  > = {
    login: {
      title: "Se connecter",
      description: "Accédez à votre espace NOLI Assurance",
    },
    register: {
      title: "Créer un compte",
      description: "Rejoignez NOLI Assurance pour comparer et souscrire",
    },
    forgot: {
      title: "Mot de passe oublié",
      description: "Réinitialisez votre mot de passe",
    },
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) setAuthModal("none");
      }}
    >
      <DialogContent className="sm:max-w-md bg-card max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {modalConfig[authModal]?.title}
          </DialogTitle>
          <DialogDescription>
            {modalConfig[authModal]?.description}
          </DialogDescription>
        </DialogHeader>

        {authModal === "login" && <LoginForm mode="modal" />}
        {authModal === "register" && <RegisterForm mode="modal" />}
        {authModal === "forgot" && <ForgotPasswordForm mode="modal" />}
      </DialogContent>
    </Dialog>
  );
}
