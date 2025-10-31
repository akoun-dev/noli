import type { Meta, StoryObj } from '@storybook/react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './alert-dialog';
import { Button } from './button';

const meta: Meta<typeof AlertDialog> = {
  title: 'UI/AlertDialog',
  component: AlertDialog,
  parameters: {
    layout: 'centered',
    tags: ['autodocs'],
  },
  argTypes: {
    open: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Ouvrir la boîte de dialogue</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action ne peut pas être annulée. Cela supprimera définitivement votre compte
            et vos données du serveur.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction>Oui, supprimer</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};

export const WithCustomContent: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Supprimer le compte</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Suppression de compte</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Cette action entraînera la suppression permanente de :
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Votre profil et toutes vos informations personnelles</li>
              <li>Historique des devis et demandes</li>
              <li>Documents et fichiers téléchargés</li>
              <li>Abonnements et préférences</li>
            </ul>
            <p className="font-semibold text-red-600 dark:text-red-400">
              Cette action est irréversible.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction variant="destructive">
            Supprimer mon compte
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};

export const WithForm: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button>Confirmer l'action</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
          <AlertDialogDescription>
            Pour confirmer, veuillez taper <strong>SUPPRIMER</strong> dans le champ ci-dessous :
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          <input
            type="text"
            placeholder="Tapez SUPPRIMER"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction disabled>Supprimer</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};

export const MultipleActions: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button>Options multiples</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Choisir une action</AlertDialogTitle>
          <AlertDialogDescription>
            Que souhaitez-vous faire avec cet élément ?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-2 py-4">
          <Button variant="outline" className="w-full justify-start">
            📝 Modifier les informations
          </Button>
          <Button variant="outline" className="w-full justify-start">
            📤 Exporter les données
          </Button>
          <Button variant="outline" className="w-full justify-start">
            📧 Envoyer par email
          </Button>
          <Button variant="destructive" className="w-full justify-start">
            🗑️ Supprimer
          </Button>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Fermer</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};

export const Accessibility: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Test d'accessibilité</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Testez avec clavier, lecteur d'écran et navigation au toucher
        </p>
      </div>

      <div className="space-y-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>Dialogue simple</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <DialogTitle>Titre accessible</DialogTitle>
              <AlertDialogDescription>
                Description claire et informative pour les utilisateurs de lecteurs d'écran.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction>Valider</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Dialogue destructif</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <DialogTitle>⚠️ Action critique</DialogTitle>
              <AlertDialogDescription>
                <span role="alert">
                  Cette action est permanente et ne peut être annulée.
                  Veuillez confirmer que vous souhaitez continuer.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction variant="destructive">Confirmer</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="text-sm text-muted-foreground">
        <p><strong>Tests à effectuer :</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li>Navigation Tab entre les boutons</li>
          <li>Activation avec Entrée/Espace</li>
          <li>Fermeture avec Échapement</li>
          <li>Lecteur d'écran compatible</li>
          <li>Contraste des couleurs suffisant</li>
        </ul>
      </div>
    </div>
  ),
};