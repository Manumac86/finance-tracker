/**
 * Tests for useFamilyGroup hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useFamilyGroup, useFamilyGroupsList } from '@/hooks/use-family-group';
import { UIFamilyGroup } from '@/lib/db/schemas/family-clerk';

// Mock SWR
jest.mock('swr', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

const mockSWR = require('swr').default;

const mockFamilyGroup: UIFamilyGroup = {
    organizationId: 'org_123',
    name: 'Test Family',
    slug: 'test-family',
    imageUrl: undefined,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    memberCount: 2,
    adminCount: 1,
    settings: {
      id: 'settings_123',
      organizationId: 'org_123',
      sharedCurrency: 'USD',
      monthlyFamilyBudget: 5000,
      permissions: {
        membersCanViewAllTransactions: true,
        membersCanEditSharedBudgets: false,
        membersCanCreateSharedGoals: true,
        requireAdminApprovalForLargeExpenses: false,
        largeExpenseThreshold: 100,
        allowIndividualBudgets: true,
        spendingNotificationsEnabled: true,
      },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    totalMonthlySpending: 2500,
    totalMonthlyIncome: 6000,
    budgetUtilization: 50,
    sharedGoalsCount: 3,
    sharedBudgetsCount: 2,
    currentUserRole: 'org:admin',
  };

describe('useFamilyGroup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('useFamilyGroup hook', () => {
    test('should return family group data when available', () => {
      const mockMutate = jest.fn();
      mockSWR.mockReturnValue({
        data: { familyGroup: mockFamilyGroup },
        error: null,
        isLoading: false,
        mutate: mockMutate,
      });

      const { result } = renderHook(() => useFamilyGroup());

      expect(result.current.familyGroup).toEqual(mockFamilyGroup);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    test('should return null when no family group exists', () => {
      const mockMutate = jest.fn();
      mockSWR.mockReturnValue({
        data: { familyGroup: null },
        error: null,
        isLoading: false,
        mutate: mockMutate,
      });

      const { result } = renderHook(() => useFamilyGroup());

      expect(result.current.familyGroup).toBe(null);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    test('should handle loading state', () => {
      const mockMutate = jest.fn();
      mockSWR.mockReturnValue({
        data: undefined,
        error: null,
        isLoading: true,
        mutate: mockMutate,
      });

      const { result } = renderHook(() => useFamilyGroup());

      expect(result.current.familyGroup).toBe(null);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBe(null);
    });

    test('should handle error state', () => {
      const mockError = new Error('Failed to fetch family data');
      const mockMutate = jest.fn();
      mockSWR.mockReturnValue({
        data: undefined,
        error: mockError,
        isLoading: false,
        mutate: mockMutate,
      });

      const { result } = renderHook(() => useFamilyGroup());

      expect(result.current.familyGroup).toBe(null);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toEqual(mockError);
    });
  });

  describe('createFamily function', () => {
    test('should create family group successfully', async () => {
      const mockMutate = jest.fn();
      mockSWR.mockReturnValue({
        data: { familyGroup: null },
        error: null,
        isLoading: false,
        mutate: mockMutate,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ familyGroup: mockFamilyGroup }),
      });

      const { result } = renderHook(() => useFamilyGroup());

      expect(result.current.isCreating).toBe(false);

      let createdFamily: UIFamilyGroup | undefined;
      await act(async () => {
        createdFamily = await result.current.createFamily({
          name: 'Test Family',
          slug: 'test-family',
        });
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/family', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Family',
          slug: 'test-family',
        }),
      });

      expect(createdFamily).toEqual(mockFamilyGroup);
      expect(mockMutate).toHaveBeenCalled();
    });

    test('should handle create family error', async () => {
      const mockMutate = jest.fn();
      mockSWR.mockReturnValue({
        data: { familyGroup: null },
        error: null,
        isLoading: false,
        mutate: mockMutate,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Name already taken' }),
      });

      const { result } = renderHook(() => useFamilyGroup());

      await expect(act(async () => {
        await result.current.createFamily({
          name: 'Test Family',
        });
      })).rejects.toThrow('Name already taken');

      expect(result.current.isCreating).toBe(false);
    });
  });

  describe('switchFamily function', () => {
    test('should switch to family organization successfully', async () => {
      const mockMutate = jest.fn();
      mockSWR.mockReturnValue({
        data: { familyGroup: null },
        error: null,
        isLoading: false,
        mutate: mockMutate,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          message: 'Switched to family organization',
          familyGroup: mockFamilyGroup 
        }),
      });

      const { result } = renderHook(() => useFamilyGroup());

      expect(result.current.isSwitching).toBe(false);

      await act(async () => {
        await result.current.switchFamily('org_123');
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/family/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: 'org_123',
        }),
      });

      expect(mockMutate).toHaveBeenCalled();
      expect(result.current.isSwitching).toBe(false);
    });

    test('should switch to individual mode successfully', async () => {
      const mockMutate = jest.fn();
      mockSWR.mockReturnValue({
        data: { familyGroup: mockFamilyGroup },
        error: null,
        isLoading: false,
        mutate: mockMutate,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          message: 'Switched to individual mode',
          familyGroup: null 
        }),
      });

      const { result } = renderHook(() => useFamilyGroup());

      await act(async () => {
        await result.current.switchFamily(null);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/family/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: null,
        }),
      });

      expect(mockMutate).toHaveBeenCalled();
    });
  });

  describe('updateFamily function', () => {
    test('should update family successfully', async () => {
      const mockMutate = jest.fn();
      mockSWR.mockReturnValue({
        data: { familyGroup: mockFamilyGroup },
        error: null,
        isLoading: false,
        mutate: mockMutate,
      });

      const updatedFamily = { ...mockFamilyGroup, name: 'Updated Family' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ familyGroup: updatedFamily }),
      });

      const { result } = renderHook(() => useFamilyGroup());

      let updated: UIFamilyGroup | undefined;
      await act(async () => {
        updated = await result.current.updateFamily('org_123', {
          name: 'Updated Family',
        });
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/family', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: 'org_123',
          name: 'Updated Family',
        }),
      });

      expect(updated).toEqual(updatedFamily);
      expect(mockMutate).toHaveBeenCalled();
    });
  });

  describe('deleteFamily function', () => {
    test('should delete family successfully', async () => {
      const mockMutate = jest.fn();
      mockSWR.mockReturnValue({
        data: { familyGroup: mockFamilyGroup },
        error: null,
        isLoading: false,
        mutate: mockMutate,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useFamilyGroup());

      await act(async () => {
        await result.current.deleteFamily('org_123');
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/family?organizationId=org_123', {
        method: 'DELETE',
      });

      expect(mockMutate).toHaveBeenCalled();
    });
  });
});

describe('useFamilyGroupsList', () => {
  test('should return family groups list', () => {
    const mockFamilyGroups = [mockFamilyGroup];
    const mockMutate = jest.fn();
    
    mockSWR.mockReturnValue({
      data: { familyGroups: mockFamilyGroups },
      error: null,
      isLoading: false,
      mutate: mockMutate,
    });

    const { result } = renderHook(() => useFamilyGroupsList());

    expect(result.current.familyGroups).toEqual(mockFamilyGroups);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  test('should return empty array when no data', () => {
    const mockMutate = jest.fn();
    
    mockSWR.mockReturnValue({
      data: undefined,
      error: null,
      isLoading: false,
      mutate: mockMutate,
    });

    const { result } = renderHook(() => useFamilyGroupsList());

    expect(result.current.familyGroups).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });
});