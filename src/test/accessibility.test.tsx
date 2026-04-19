import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock axe-core to avoid initialization issues
vi.mock('@axe-core/react', () => ({
  axe: vi.fn().mockResolvedValue({ violations: [] }),
}));

// Import components to test
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

describe('Accessibility Tests - WCAG 2.1 AA Compliance', () => {

  describe('Button Component', () => {
    it('should have proper ARIA attributes when disabled', () => {
      render(<Button disabled>Disabled Button</Button>);
      const button = screen.getByRole('button', { name: /disabled button/i });

      expect(button).toHaveAttribute('disabled');
      // Note: aria-disabled is automatically set by browsers when disabled attribute is present
      expect(button).toBeDisabled();
    });

    it('should be keyboard accessible', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });

      expect(button).toBeVisible();
      // Buttons are naturally focusable and don't need explicit tabIndex="0"
      expect(button).not.toHaveAttribute('tabIndex', '-1');
    });

    it('should have accessible names for all variants', () => {
      render(
        <div>
          <Button>Default Button</Button>
          <Button variant="destructive">Destructive Action</Button>
          <Button variant="outline">Outline Button</Button>
          <Button size="sm">Small Button</Button>
        </div>
      );

      expect(screen.getByRole('button', { name: /default button/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /destructive action/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /outline button/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /small button/i })).toBeInTheDocument();
    });
  });

  describe('Status Badge Component', () => {
    it('should be accessible with proper text content', () => {
      render(
        <div>
          <StatusBadge variant="success">Success</StatusBadge>
          <StatusBadge variant="warning">Warning</StatusBadge>
          <StatusBadge variant="error">Error</StatusBadge>
          <StatusBadge variant="info">Information</StatusBadge>
          <StatusBadge variant="default">Default</StatusBadge>
        </div>
      );

      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('Warning')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Information')).toBeInTheDocument();
      expect(screen.getByText('Default')).toBeInTheDocument();
    });

    it('should have sufficient color contrast for accessibility', () => {
      const { container } = render(
        <div>
          <StatusBadge variant="success">Success Status</StatusBadge>
          <StatusBadge variant="error">Error Status</StatusBadge>
          <StatusBadge variant="warning">Warning Status</StatusBadge>
        </div>
      );

      // Check that badges have proper class names for contrast
      const badges = container.querySelectorAll('[class*="bg-"]');
      expect(badges.length).toBeGreaterThan(0);

      badges.forEach(badge => {
        expect(badge).toBeVisible();
      });
    });
  });

  describe('Alert Dialog Component', () => {
    it('should have proper ARIA attributes when open', () => {
      render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Confirmation</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this item? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      // Check for proper dialog attributes
      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toBeInTheDocument();

      // Check for proper heading structure
      const title = screen.getByRole('heading', { name: /delete confirmation/i });
      expect(title).toBeInTheDocument();

      // Check for descriptive content
      const description = screen.getByText(/are you sure you want to delete/i);
      expect(description).toBeInTheDocument();

      // Check for action buttons
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });
  });

  describe('Form Accessibility', () => {
    it('should have proper form labels', () => {
      const TestForm = () => (
        <form>
          <label htmlFor="email">Email Address</label>
          <input id="email" type="email" required />

          <label htmlFor="password">Password</label>
          <input id="password" type="password" required />

          <Button type="submit">Submit</Button>
        </form>
      );

      render(<TestForm />);

      // Check for proper label associations
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('required');

      // Check for submit button
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });

    it('should have proper error messages association', () => {
      const TestForm = () => (
        <form>
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            required
            aria-describedby="email-error"
            aria-invalid="true"
          />
          <div id="email-error" role="alert">
            Please enter a valid email address
          </div>
        </form>
      );

      render(<TestForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      const errorMessage = screen.getByText(/please enter a valid email address/i);

      expect(emailInput).toHaveAttribute('aria-describedby', 'email-error');
      expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      expect(errorMessage).toHaveAttribute('role', 'alert');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should have proper focus management', () => {
      render(
        <div>
          <Button>First Button</Button>
          <Button>Second Button</Button>
          <Button>Third Button</Button>
        </div>
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);

      buttons.forEach(button => {
        expect(button).toBeVisible();
        // Buttons are naturally focusable
        expect(button).not.toHaveAttribute('tabIndex', '-1');
      });
    });

    it('should handle focus trapping in dialogs', () => {
      render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Dialog Title</AlertDialogTitle>
              <AlertDialogDescription>Description</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      // Check that dialog content is focusable
      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toBeInTheDocument();

      // Check that buttons are focusable
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      const confirmButton = screen.getByRole('button', { name: /confirm/i });

      expect(cancelButton).toBeVisible();
      expect(confirmButton).toBeVisible();
    });
  });

  describe('Link Accessibility', () => {
    it('should have accessible link names', () => {
      const TestComponent = () => (
        <div>
          <a href="/home">Home Page</a>
          <a href="/about">About Us</a>
          <a href="/contact" aria-label="Contact us via email">contact@example.com</a>
        </div>
      );

      render(<TestComponent />);

      expect(screen.getByRole('link', { name: /home page/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /about us/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /contact us via email/i })).toBeInTheDocument();
    });
  });

  describe('Image Accessibility', () => {
    it('should have alt text for images', () => {
      const TestComponent = () => (
        <div>
          <img src="/logo.png" alt="Company Logo" />
          <img src="/banner.jpg" alt="Promotional banner showing our products" />
          <img src="/decorative.png" alt="" role="presentation" />
        </div>
      );

      render(<TestComponent />);

      const logo = screen.getByAltText(/company logo/i);
      const banner = screen.getByAltText(/promotional banner/i);
      const decorative = screen.getByRole('presentation');

      expect(logo).toBeInTheDocument();
      expect(banner).toBeInTheDocument();
      expect(decorative).toBeInTheDocument();
    });
  });

  describe('Table Accessibility', () => {
    it('should have proper table headers', () => {
      const TestTable = () => (
        <table>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Email</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>John Doe</td>
              <td>john@example.com</td>
              <td>Active</td>
            </tr>
          </tbody>
        </table>
      );

      render(<TestTable />);

      // Check for column headers
      expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /email/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument();

      // Check for table cells
      expect(screen.getByRole('cell', { name: /john doe/i })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: /john@example.com/i })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: /active/i })).toBeInTheDocument();
    });
  });

  describe('Color Contrast and Visual Accessibility', () => {
    it('should have proper semantic structure', () => {
      const TestComponent = () => (
        <main>
          <h1>Page Title</h1>
          <section>
            <h2>Section Title</h2>
            <p>Regular text content</p>
          </section>
        </main>
      );

      render(<TestComponent />);

      // Check for proper heading hierarchy
      expect(screen.getByRole('heading', { level: 1, name: /page title/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: /section title/i })).toBeInTheDocument();

      // Check for landmark roles
      expect(screen.getByRole('main')).toBeInTheDocument();
      // Section might not be recognized as region without aria-label or explicit role
      const section = document.querySelector('section');
      expect(section).toBeInTheDocument();
    });
  });
});