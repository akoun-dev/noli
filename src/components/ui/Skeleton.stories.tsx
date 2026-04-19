import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton, CardSkeleton, TableSkeleton, ListSkeleton, StatsSkeleton, FormSkeleton } from './skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'UI/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
    tags: ['autodocs'],
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'text', 'circular', 'rectangular'],
    },
    width: {
      control: { type: 'number' },
    },
    height: {
      control: { type: 'number' },
    },
    lines: {
      control: { type: 'number' },
    },
    className: {
      control: { type: 'text' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    className: 'w-[300px] h-4',
  },
};

export const Variants: Story = {
  render: () => (
    <div className="space-y-4 w-64">
      <div>
        <p className="text-sm font-medium mb-2">Default</p>
        <Skeleton className="h-4 w-full" />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Text</p>
        <Skeleton variant="text" />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Circular</p>
        <Skeleton variant="circular" width={48} height={48} />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Rectangular</p>
        <Skeleton variant="rectangular" width={200} height={100} />
      </div>
    </div>
  ),
};

export const MultipleLines: Story = {
  args: {
    variant: 'text',
    lines: 3,
  },
};

export const CustomDimensions: Story = {
  render: () => (
    <div className="space-y-4 w-64">
      <Skeleton width={100} height={20} />
      <Skeleton width="75%" height={16} />
      <Skeleton width="50%" height={12} />
      <Skeleton width="25%" height={8} />
    </div>
  ),
};

export const CardSkeletonExample: Story = {
  render: () => (
    <div className="max-w-md">
      <CardSkeleton />
    </div>
  ),
};

export const TableSkeletonExample: Story = {
  render: () => (
    <div className="w-full max-w-2xl">
      <TableSkeleton rows={5} columns={4} />
    </div>
  ),
};

export const ListSkeletonExample: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <ListSkeleton items={3} />
    </div>
  ),
};

export const StatsSkeletonExample: Story = {
  render: () => (
    <div className="w-full max-w-4xl">
      <StatsSkeleton items={4} />
    </div>
  ),
};

export const FormSkeletonExample: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <FormSkeleton fields={4} />
    </div>
  ),
};

export const ComplexLayout: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-6xl">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <Skeleton width={200} height={40} />
        <div className="flex gap-2">
          <Skeleton width={100} height={40} />
          <Skeleton width={100} height={40} />
        </div>
      </div>

      {/* Stats cards */}
      <StatsSkeleton items={4} />

      {/* Content grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card skeleton */}
        <CardSkeleton showAvatar showTitle showDescription showFooter />
        <CardSkeleton showAvatar showTitle showDescription showFooter />
        <CardSkeleton showAvatar showTitle showDescription showFooter />
      </div>

      {/* Table skeleton */}
      <TableSkeleton rows={3} columns={5} />
    </div>
  ),
};

export const Animated: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="text-sm font-medium">Animation par défaut</div>
      <Skeleton className="w-64 h-4" />
      <CardSkeleton />
      <TableSkeleton rows={3} columns={3} />
    </div>
  ),
};

export const WithErrorState: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="text-sm font-medium">Chargement avec fallback</div>
      <div className="relative">
        <Skeleton className="w-64 h-4" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm text-muted-foreground">Chargement...</span>
        </div>
      </div>
      <CardSkeleton />
    </div>
  ),
};

export const DarkMode: Story = {
  render: () => (
    <div className="dark space-y-4 bg-background text-foreground p-6 rounded-lg">
      <div className="text-sm font-medium">Mode sombre</div>
      <Skeleton className="w-64 h-4" />
      <CardSkeleton />
      <TableSkeleton rows={3} columns={4} />
    </div>
  ),
};

export const Accessibility: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Accessibilité</h3>
        <p className="text-sm text-muted-foreground">
          Les skeletons doivent indiquer du chargement sans être distrayants
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-2">Contraste suffisant</p>
          <div className="bg-muted p-4 rounded">
            <Skeleton className="w-64 h-4" />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Animation respecteuse-preferred-motion</p>
          <div className="space-y-2">
            <Skeleton className="w-64 h-4" />
            <Skeleton variant="text" lines={2} />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Structure sémantique</p>
          <div role="status" aria-label="Chargement">
            <div className="space-y-2">
              <Skeleton className="w-64 h-4" />
              <Skeleton variant="text" lines={1} />
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Screen reader friendly</p>
          <div aria-live="polite" aria-busy="true">
            <CardSkeleton />
            <p className="sr-only">Le contenu est en cours de chargement</p>
          </div>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        <p><strong>Tests d'accessibilité :</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li>Les skeletons ne doivent pas interférer avec la navigation clavier</li>
          <li>Les animations peuvent être désactivées</li>
          <li>Le contenu reste accessible aux lecteurs d'écran</li>
          <li>Les couleurs respectent les ratios de contraste WCAG</li>
        </ul>
      </div>
    </div>
  ),
};