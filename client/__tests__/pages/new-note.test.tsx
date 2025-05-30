import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import NewNotePage from '@/app/notes/new/page';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockRefresh = jest.fn();
const mockRouter = { push: mockPush, back: mockBack, refresh: mockRefresh };

describe('New Note Page', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Rendering', () => {
    it('should render form with all required fields', () => {
      render(<NewNotePage />);

      expect(screen.getByText('Create New Note')).toBeInTheDocument();
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/content/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create note/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should show description text', () => {
      render(<NewNotePage />);

      expect(screen.getByText(/add a new note to your collection/i)).toBeInTheDocument();
    });

    it('should have back button', () => {
      render(<NewNotePage />);

      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    it('should have proper placeholder text', () => {
      render(<NewNotePage />);

      expect(screen.getByPlaceholderText(/enter note title/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter note content/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should require title field', async () => {
      render(<NewNotePage />);

      const contentInput = screen.getByLabelText(/content/i);
      const submitButton = screen.getByRole('button', { name: /create note/i });

      fireEvent.change(contentInput, { target: { value: 'Test content' } });
      fireEvent.click(submitButton);

      // HTML5 validation should prevent submission
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should require content field', async () => {
      render(<NewNotePage />);

      const titleInput = screen.getByLabelText(/title/i);
      const submitButton = screen.getByRole('button', { name: /create note/i });

      fireEvent.change(titleInput, { target: { value: 'Test Title' } });
      fireEvent.click(submitButton);

      // HTML5 validation should prevent submission
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should have proper input attributes', () => {
      render(<NewNotePage />);

      const titleInput = screen.getByLabelText(/title/i);
      const contentInput = screen.getByLabelText(/content/i);

      expect(titleInput).toHaveAttribute('required');
      expect(contentInput).toHaveAttribute('required');
    });
  });

  describe('Successful Note Creation', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ 
          id: 'new-note-id', 
          title: 'Test Title', 
          content: 'Test Content' 
        }),
      });
    });

    it('should submit form with correct data', async () => {
      render(<NewNotePage />);

      const titleInput = screen.getByLabelText(/title/i);
      const contentInput = screen.getByLabelText(/content/i);
      const submitButton = screen.getByRole('button', { name: /create note/i });

      fireEvent.change(titleInput, { target: { value: 'Test Title' } });
      fireEvent.change(contentInput, { target: { value: 'Test Content' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/notes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Test Title',
            content: 'Test Content',
          }),
          credentials: 'include',
        });
      });
    });

    it('should redirect to dashboard after successful creation', async () => {
      render(<NewNotePage />);

      const titleInput = screen.getByLabelText(/title/i);
      const contentInput = screen.getByLabelText(/content/i);
      const submitButton = screen.getByRole('button', { name: /create note/i });

      fireEvent.change(titleInput, { target: { value: 'Test Title' } });
      fireEvent.change(contentInput, { target: { value: 'Test Content' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it('should show loading state during submission', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValue(promise);

      render(<NewNotePage />);

      const titleInput = screen.getByLabelText(/title/i);
      const contentInput = screen.getByLabelText(/content/i);
      const submitButton = screen.getByRole('button', { name: /create note/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      fireEvent.change(titleInput, { target: { value: 'Test Title' } });
      fireEvent.change(contentInput, { target: { value: 'Test Content' } });
      fireEvent.click(submitButton);

      expect(screen.getByText(/creating.../i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
      expect(titleInput).toBeDisabled();
      expect(contentInput).toBeDisabled();

      // Resolve the promise to finish the test
      resolvePromise!({
        ok: true,
        json: () => Promise.resolve({ id: 'new-note-id' }),
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on creation failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ message: 'Failed to create note' }),
      });

      render(<NewNotePage />);

      const titleInput = screen.getByLabelText(/title/i);
      const contentInput = screen.getByLabelText(/content/i);
      const submitButton = screen.getByRole('button', { name: /create note/i });

      fireEvent.change(titleInput, { target: { value: 'Test Title' } });
      fireEvent.change(contentInput, { target: { value: 'Test Content' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to create note')).toBeInTheDocument();
      });
    });

    it('should display generic error message when API returns no message', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      });

      render(<NewNotePage />);

      const titleInput = screen.getByLabelText(/title/i);
      const contentInput = screen.getByLabelText(/content/i);
      const submitButton = screen.getByRole('button', { name: /create note/i });

      fireEvent.change(titleInput, { target: { value: 'Test Title' } });
      fireEvent.change(contentInput, { target: { value: 'Test Content' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to create note')).toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<NewNotePage />);

      const titleInput = screen.getByLabelText(/title/i);
      const contentInput = screen.getByLabelText(/content/i);
      const submitButton = screen.getByRole('button', { name: /create note/i });

      fireEvent.change(titleInput, { target: { value: 'Test Title' } });
      fireEvent.change(contentInput, { target: { value: 'Test Content' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should clear error when form is resubmitted', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ message: 'Failed to create note' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 'new-note-id' }),
        });

      render(<NewNotePage />);

      const titleInput = screen.getByLabelText(/title/i);
      const contentInput = screen.getByLabelText(/content/i);
      const submitButton = screen.getByRole('button', { name: /create note/i });

      // First submission with error
      fireEvent.change(titleInput, { target: { value: 'Test Title' } });
      fireEvent.change(contentInput, { target: { value: 'Test Content' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to create note')).toBeInTheDocument();
      });

      // Second submission should clear error
      fireEvent.change(titleInput, { target: { value: 'Updated Title' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('Failed to create note')).not.toBeInTheDocument();
      });
    });

    it('should re-enable form after error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ message: 'Failed to create note' }),
      });

      render(<NewNotePage />);

      const titleInput = screen.getByLabelText(/title/i);
      const contentInput = screen.getByLabelText(/content/i);
      const submitButton = screen.getByRole('button', { name: /create note/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      fireEvent.change(titleInput, { target: { value: 'Test Title' } });
      fireEvent.change(contentInput, { target: { value: 'Test Content' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to create note')).toBeInTheDocument();
        expect(submitButton).not.toBeDisabled();
        expect(cancelButton).not.toBeDisabled();
        expect(titleInput).not.toBeDisabled();
        expect(contentInput).not.toBeDisabled();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate back when back button is clicked', () => {
      render(<NewNotePage />);

      const backButton = screen.getByRole('button', { name: /back/i });
      fireEvent.click(backButton);

      expect(mockBack).toHaveBeenCalled();
    });

    it('should navigate back when cancel button is clicked', () => {
      render(<NewNotePage />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockBack).toHaveBeenCalled();
    });

    it('should not allow navigation when form is submitting', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValue(promise);

      render(<NewNotePage />);

      const titleInput = screen.getByLabelText(/title/i);
      const contentInput = screen.getByLabelText(/content/i);
      const submitButton = screen.getByRole('button', { name: /create note/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      fireEvent.change(titleInput, { target: { value: 'Test Title' } });
      fireEvent.change(contentInput, { target: { value: 'Test Content' } });
      fireEvent.click(submitButton);

      expect(cancelButton).toBeDisabled();

      // Resolve the promise
      resolvePromise!({
        ok: true,
        json: () => Promise.resolve({ id: 'new-note-id' }),
      });
    });
  });

  describe('Form Behavior', () => {
    it('should allow typing in title field', () => {
      render(<NewNotePage />);

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'My New Note Title' } });

      expect(titleInput).toHaveValue('My New Note Title');
    });

    it('should allow typing in content field', () => {
      render(<NewNotePage />);

      const contentInput = screen.getByLabelText(/content/i);
      fireEvent.change(contentInput, { target: { value: 'This is my note content with multiple lines.\nLine 2.\nLine 3.' } });

      expect(contentInput).toHaveValue('This is my note content with multiple lines.\nLine 2.\nLine 3.');
    });

    it('should have proper textarea sizing', () => {
      render(<NewNotePage />);

      const contentInput = screen.getByLabelText(/content/i);
      expect(contentInput).toHaveClass('min-h-[200px]');
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      render(<NewNotePage />);

      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/content/i)).toBeInTheDocument();
    });

    it('should have accessible button labels', () => {
      render(<NewNotePage />);

      expect(screen.getByRole('button', { name: /create note/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    it('should maintain focus management during loading state', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValue(promise);

      render(<NewNotePage />);

      const titleInput = screen.getByLabelText(/title/i);
      const contentInput = screen.getByLabelText(/content/i);
      const submitButton = screen.getByRole('button', { name: /create note/i });

      fireEvent.change(titleInput, { target: { value: 'Test Title' } });
      fireEvent.change(contentInput, { target: { value: 'Test Content' } });
      fireEvent.click(submitButton);

      // Form should be disabled during submission
      expect(titleInput).toBeDisabled();
      expect(contentInput).toBeDisabled();

      // Resolve the promise
      resolvePromise!({
        ok: true,
        json: () => Promise.resolve({ id: 'new-note-id' }),
      });
    });
  });
}); 