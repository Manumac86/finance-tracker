import useSWR from 'swr';
import { useState } from 'react';
import { UIFamilyGroup } from '@/lib/db/schemas/family-clerk';

interface FamilyGroupResponse {
  familyGroup: UIFamilyGroup | null;
}

interface FamilyGroupsListResponse {
  familyGroups: UIFamilyGroup[];
}

interface CreateFamilyRequest {
  name: string;
  slug?: string;
  familySettings?: {
    shared_currency?: string;
    monthly_family_budget?: number | null;
    permissions?: {
      members_can_view_all_transactions?: boolean;
      members_can_edit_shared_budgets?: boolean;
      members_can_create_shared_goals?: boolean;
      require_admin_approval_for_large_expenses?: boolean;
      large_expense_threshold?: number;
      allow_individual_budgets?: boolean;
      spending_notifications_enabled?: boolean;
    };
  };
}

interface SwitchFamilyRequest {
  organizationId: string | null;
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch');
  }
  return response.json();
};

export function useFamilyGroup() {
  const [isCreating, setIsCreating] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const { 
    data, 
    error, 
    isLoading, 
    mutate 
  } = useSWR<FamilyGroupResponse>('/api/family', fetcher);

  const familyGroup = data?.familyGroup || null;

  const createFamily = async (familyData: CreateFamilyRequest): Promise<UIFamilyGroup> => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/family', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(familyData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create family group');
      }

      const result = await response.json();
      await mutate(); // Refresh the family data
      return result.familyGroup;
    } finally {
      setIsCreating(false);
    }
  };

  const updateFamily = async (
    organizationId: string, 
    updateData: Partial<CreateFamilyRequest>
  ): Promise<UIFamilyGroup> => {
    const response = await fetch('/api/family', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        organizationId,
        ...updateData,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update family group');
    }

    const result = await response.json();
    await mutate(); // Refresh the family data
    return result.familyGroup;
  };

  const switchFamily = async (organizationId: string | null): Promise<void> => {
    setIsSwitching(true);
    try {
      const response = await fetch('/api/family/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ organizationId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to switch family organization');
      }

      await mutate(); // Refresh the family data
    } finally {
      setIsSwitching(false);
    }
  };

  const deleteFamily = async (organizationId: string): Promise<void> => {
    const response = await fetch(`/api/family?organizationId=${organizationId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete family group');
    }

    await mutate(); // Refresh the family data
  };

  return {
    familyGroup,
    isLoading,
    error,
    isCreating,
    isSwitching,
    createFamily,
    updateFamily,
    switchFamily,
    deleteFamily,
    refetch: mutate,
  };
}

export function useFamilyGroupsList() {
  const { 
    data, 
    error, 
    isLoading, 
    mutate 
  } = useSWR<FamilyGroupsListResponse>('/api/family?action=list', fetcher);

  return {
    familyGroups: data?.familyGroups || [],
    isLoading,
    error,
    refetch: mutate,
  };
}