import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminProductForm } from './product-form';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useParams: vi.fn(() => ({})),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

// Mock services hook
const mockServices = {
  productService: {
    getProduct: vi.fn(),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
  },
  taxonomyService: {
    getCategories: vi.fn(() => Promise.resolve([])),
    getTypes: vi.fn(() => Promise.resolve([])),
  },
  authService: {
    getCurrentUser: vi.fn(() => Promise.resolve({ id: 'user-1', email: 'test@test.com' })),
  },
};

vi.mock('../../hooks/useServices', () => ({
  useServices: () => mockServices,
}));

// Mock toast
vi.mock('../../components/admin/AdminComponents', () => ({
  SkeletonPage: () => <div data-testid="skeleton">Loading...</div>,
  AdminConfirmDialog: ({ open, title }: { open: boolean; title: string }) => open ? <div>{title}</div> : null,
  useToast: () => ({
    toast: vi.fn(),
  }),
  HelpTooltip: ({ text }: { text: string }) => <span title={text}>?</span>,
}));

describe('AdminProductForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders for new product creation', async () => {
    render(<AdminProductForm />);
    
    // Check for title
    expect(screen.getByText(/New product/i)).toBeInTheDocument();
    
    // Check for essential inputs
    expect(screen.getByPlaceholderText(/Product title/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Describe condition/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Quantity available/i)).toBeInTheDocument();
  });

  it('shows error if saving with invalid price', async () => {
    const user = userEvent.setup();
    render(<AdminProductForm />);
    
    // Fill in required fields with invalid price
    await user.type(screen.getByPlaceholderText(/Product title/i), 'New Card');
    await user.type(screen.getByPlaceholderText(/Describe condition/i), 'Mint condition');
    await user.type(screen.getByTestId('product-price'), '-10');
    await user.type(screen.getByTestId('product-stock'), '5');
    
    // Submit
    const saveBtn = screen.getByRole('button', { name: /save product/i });
    await user.click(saveBtn);
    
    // Error should appear
    await waitFor(() => {
      expect(screen.getByText(/Price must be a non-negative/i)).toBeInTheDocument();
    });
  });

  it('calls createProduct on successful submission', async () => {
    const user = userEvent.setup();
    render(<AdminProductForm />);
    
    await user.type(screen.getByPlaceholderText(/Product title/i), 'New Card');
    await user.type(screen.getByPlaceholderText(/Describe condition/i), 'Mint condition');
    await user.type(screen.getByTestId('product-price'), '10.50');
    await user.type(screen.getByTestId('product-stock'), '5');
    
    const saveBtn = screen.getByRole('button', { name: /save product/i });
    await user.click(saveBtn);
    
    await waitFor(() => {
      expect(mockServices.productService.createProduct).toHaveBeenCalled();
    });
  });
});
