# Charte Graphique — NOLI Assurance

## Palette de couleurs (HSL)

### Mode Light (`:root`)

| Token | HSL | Hex | Rôle |
|-------|-----|-----|------|
| `--primary` | `195 65% 21%` | **#1B464D** | Azur foncé — marque principale |
| `--primary-foreground` | `68 76% 54%` | **#DEEF4A** | Jaune vert — texte sur primary |
| `--secondary` | `177 60% 31%` | **#23847E** | Cyan |
| `--secondary-foreground` | `0 0% 100%` | **#FFFFFF** | Blanc |
| `--accent` | `68 76% 54%` | **#DEEF4A** | Jaune vert |
| `--accent-foreground` | `120 2% 9%` | **#171817** | Noir profond |
| `--background` | `0 0% 100%` | **#FFFFFF** | Fond |
| `--foreground` | `120 2% 9%` | **#171817** | Texte principal |
| `--muted` | `148 13% 73%` | **#A0B6AC** | Vert grisé |
| `--muted-foreground` | `188 30% 30%` | **#36636D** | Teal |
| `--card` | `153 16% 92%` | **#E6F0EB** | Fond carte |
| `--card-foreground` | `120 2% 9%` | **#171817** | Texte carte |
| `--popover` | `153 16% 98%` | **#F9FCFA** | Fond popover |
| `--destructive` | `4 84% 58%` | **#E85544** | Rouge |
| `--destructive-foreground` | `0 0% 100%` | **#FFFFFF** | Blanc |
| `--border` | `148 13% 73%` | **#A0B6AC** | Bordure |
| `--input` | `148 13% 73%` | **#A0B6AC** | Input |
| `--ring` | `68 76% 54%` | **#DEEF4A** | Focus ring |
| `--success` | `176 58% 33%` | **#23847E** | Succès |
| `--info` | `188 48% 35%` | **#2E7380** | Info |
| `--radius` | `0.75rem` | `12px` | Bordures |

### Sidebar (Light)

| Token | HSL | Hex |
|-------|-----|-----|
| `--sidebar-background` | `195 65% 21%` | **#1B464D** |
| `--sidebar-foreground` | `66 85% 96%` | **#F2F8E0** |
| `--sidebar-primary` | `177 60% 31%` | **#23847E** |
| `--sidebar-primary-foreground` | `0 0% 100%` | **#FFFFFF** |
| `--sidebar-accent` | `68 76% 54%` | **#DEEF4A** |
| `--sidebar-accent-foreground` | `120 2% 9%` | **#171817** |
| `--sidebar-border` | `188 35% 35%` | **#3A7886** |

### Mode Dark (`.dark`)

| Token | HSL | Hex approx. |
|-------|-----|-------------|
| `--primary` | `66 85% 61%` | **#DEEF55** |
| `--primary-foreground` | `120 3% 8%` | **#141514** |
| `--secondary` | `176 58% 33%` | **#23847E** |
| `--accent` | `188 48% 22%` | **#1D535E** |
| `--accent-foreground` | `66 85% 61%` | **#DEEF55** |
| `--background` | `120 3% 8%` | **#141514** |
| `--foreground` | `153 23% 96%` | **#F0F7F3** |
| `--card` | `188 35% 14%` | **#173138** |
| `--muted` | `188 30% 18%` | **#1F3C44** |
| `--muted-foreground` | `153 10% 78%` | **#C0D1C7** |
| `--destructive` | `5 68% 46%` | **#C94A3A** |
| `--border` | `188 30% 22%` | **#264C55** |
| `--ring` | `68 76% 54%` | **#DEEF4A** |
| `--sidebar-background` | `120 3% 8%` | **#141514** |
| `--sidebar-primary` | `66 85% 61%` | **#DEEF55** |
| `--sidebar-primary-foreground` | `120 3% 8%` | **#141514** |
| `--sidebar-accent` | `176 58% 33%` | **#23847E** |
| `--sidebar-accent-foreground` | `0 0% 100%` | **#FFFFFF** |
| `--sidebar-border` | `188 25% 18%` | **#233A42** |

## Typographie

| Usage | Font stack | Poids | Taille |
|-------|-----------|-------|--------|
| Affichage (h1) | `Klein` → `Space Grotesk`, `Nunito Sans`, sans-serif | 700 | `clamp(2rem, 5vw, 3rem)` |
| Sous-titres (h2) | `Nunito Sans`, `Poppins`, sans-serif | 700 | `clamp(1.5rem, 3vw, 2.25rem)` |
| Corps (p, li, label) | `Poppins`, `Nunito Sans`, system-ui, sans-serif | 400 | `1rem`, lh: 1.6 |

**Polices chargées :** Space Grotesk (600), Nunito Sans (400, 600, 700), Poppins (400, 500, 600, 700)

> ⚠️ La police **Klein** (police display d'origine) n'est pas disponible dans le dépôt.
> Space Grotesk est utilisée comme substitut.

## Ombres

| Variable | Light | Dark |
|----------|-------|------|
| `--card-shadow` | `0 20px 45px -15px hsl(188 48% 22% / 0.15)` | `0 25px 55px -20px hsl(188 48% 5% / 0.6)` |
| `--hover-shadow` | `0 30px 55px -15px hsl(176 58% 33% / 0.25)` | `0 30px 65px -20px hsl(66 85% 61% / 0.45)` |

## Dégradés

```css
/* Hero gradient (light) */
linear-gradient(145deg,
  hsl(188 48% 92%) 0%,    /* Teal clair */
  hsl(176 58% 90%) 35%,   /* Cyan clair */
  hsl(66 85% 80%) 100%    /* Jaune vert clair */
);

/* Hero gradient (dark) */
linear-gradient(145deg,
  hsl(120 3% 8%) 0%,      /* Noir */
  hsl(188 35% 15%) 70%,   /* Teal foncé */
  hsl(176 58% 22%) 100%   /* Cyan foncé */
);

/* bg-hero (classe utilitaire) */
background:
  radial-gradient(circle at 20% 20%, hsl(176 58% 55%) 0%, transparent 35%),
  radial-gradient(circle at 80% 0%, hsl(188 48% 45%) 0%, transparent 30%),
  radial-gradient(circle at 50% 80%, hsl(66 85% 45%) 0%, transparent 25%),
  hsl(188 48% 20%);
```

## Bordures & Radius

- `--radius` : `0.75rem` (12px)
- `rounded-lg` : `0.75rem`, `rounded-md` : `0.625rem`, `rounded-sm` : `0.5rem`

## Logos

Tous les fichiers dans `public/img/` :

| Fichier | Usage |
|---------|-------|
| `noli vertical sans fond.png` | Logo principal (Header, Footer, Sidebar) |
| `noli_sans_fond.png` | Watermark arrière-plan body |
| `zebre_plein_sans_fond.png` | Mascotte zèbre (sans fond) |
| `zebre fond vert.png` | Mascotte zèbre (fond vert) |

Favicons dans `public/` : `favicon.svg`, `favicon.ico`, `apple-touch-icon.png`, `favicon-96x96.png`

## Animations

| Animation | Durée | Effet |
|-----------|-------|-------|
| `fade-in` | 0.5s ease-out | Opacity 0→1 + translateY(10px→0) |
| `slide-up` | 0.6s ease-out | Opacity 0→1 + translateY(20px→0) |
| `float` | 3s ease-in-out infinite | translateY(0→-10px→0) |
| `accordion-down` | 0.2s ease-out | Radix accordion open |
| `accordion-up` | 0.2s ease-out | Radix accordion close |

## Layout

| Élément | Valeur |
|---------|--------|
| Sidebar dépliée | `16rem` (256px) |
| Sidebar repliée | `3rem` (48px) |
| Sidebar mobile | `18rem` (288px) |
| Container max | `1400px` (2xl) |
| Container padding | `2rem` |
| Header sticky | `bg-card/80 backdrop-blur-lg` |

## Breakpoints

| Nom | Largeur |
|-----|---------|
| mobile | `< 768px` |
| tablet | `768px - 1023px` |
| laptop | `1024px - 1279px` |
| desktop | `1280px - 1535px` |
| wide | `>= 1536px` |

## Anomalies / À corriger

1. **`src/config/theme.ts`** obsolète — utilise `#3b82f6` (bleu générique) au lieu de `#1B464D`
2. **`public/site.webmanifest`** — `theme_color: "#1e40af"` devrait être `#1B464D`
3. Police **Klein** absente du dépôt (substitut : Space Grotesk)
4. Pas de fichier Figma (`.fig`) dans le repo
