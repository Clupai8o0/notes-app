import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import DashboardPage from '@/app/page';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockPush = jest.fn();
const mockRouter = { push: mockPush };

describe('Dashboard Page', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading spinner initially', () => {
      (mockFetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<DashboardPage />);
      
      // Check for the loading spinner element by class
      const loadingContainer = document.querySelector('.animate-spin');
      expect(loadingContainer).toBeInTheDocument();
    });
  });

  describe('Successful Data Loading', () => {
    const mockNotes = [
      {
        _id: '1',
        title: 'Test Note 1',
        content: 'This is the content of test note 1',
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z',
      },
      {
        _id: '2',
        title: 'Test Note 2',
        content: 'This is the content of test note 2',
        createdAt: '2024-01-02T10:00:00Z',
        updatedAt: '2024-01-02T10:00:00Z',
      },
    ];

    beforeEach(() => {
      (mockFetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockNotes),
      });
    });

    it('should display notes after successful fetch', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('My Notes')).toBeInTheDocument();
        expect(screen.getByText('Test Note 1')).toBeInTheDocument();
        expect(screen.getByText('Test Note 2')).toBeInTheDocument();
      });
    });

    it('should display note creation date', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('1/1/2024')).toBeInTheDocument();
        expect(screen.getByText('1/2/2024')).toBeInTheDocument();
      });
    });

    it('should show Create Note button', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Create Note')).toBeInTheDocument();
      });
    });

    it('should navigate to new note page when Create Note is clicked', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Create Note'));
      });

      expect(mockPush).toHaveBeenCalledWith('/notes/new');
    });

    it('should show edit and delete buttons for each note', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        // Find buttons by their SVG icons - each note should have 2 icon buttons
        const allButtons = screen.getAllByRole('button');
        // Filter out the "Create Note" button - should have 4 icon buttons (2 per note)
        const iconButtons = allButtons.filter(button => 
          button.querySelector('svg') && !button.textContent?.includes('Create Note')
        );
        expect(iconButtons).toHaveLength(4);
      });
    });
  });

  describe('Empty State', () => {
    beforeEach(() => {
      (mockFetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });
    });

    it('should show empty state when no notes exist', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('No notes yet. Create your first note!')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should redirect to login on 401 error', async () => {
      (mockFetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login');
      });
    });

    it('should show error message on fetch failure', async () => {
      (mockFetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch notes')).toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      (mockFetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      (mockFetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });
    });

    it('should have proper heading structure', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1, name: 'My Notes' })).toBeInTheDocument();
      });
    });

    it('should have accessible button labels', async () => {
      const mockNotes = [
        {
          _id: '1',
          title: 'Test Note 1',
          content: 'Content',
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T10:00:00Z',
        },
      ];

      (mockFetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockNotes),
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Create Note' })).toBeInTheDocument();
      });
    });
  });
}); 