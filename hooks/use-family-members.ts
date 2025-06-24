import useSWR from 'swr';
import { UIFamilyMember } from '@/lib/db/schemas/family-clerk';

interface FamilyMembersResponse {
  members: UIFamilyMember[];
}

interface UpdateMemberSettingsRequest {
  organizationId: string;
  memberUserId: string;
  memberSettings: {
    display_name?: string;
    spending_limit_per_month?: number;
    can_view_all_accounts?: boolean;
    receive_spending_notifications?: boolean;
  };
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch');
  }
  return response.json();
};

export function useFamilyMembers(organizationId: string) {
  const { 
    data, 
    error, 
    isLoading, 
    mutate 
  } = useSWR<FamilyMembersResponse>(
    organizationId ? `/api/family/members?organizationId=${organizationId}` : null,
    fetcher
  );

  const members = data?.members || [];

  const updateMemberSettings = async (
    memberUserId: string,
    memberSettings: UpdateMemberSettingsRequest['memberSettings']
  ): Promise<void> => {
    const response = await fetch('/api/family/members', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        organizationId,
        memberUserId,
        memberSettings,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update member settings');
    }

    await mutate(); // Refresh the members data
  };

  const removeMember = async (memberUserId: string): Promise<void> => {
    const response = await fetch(`/api/family/members?organizationId=${organizationId}&memberUserId=${memberUserId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to remove member');
    }

    await mutate(); // Refresh the members data
  };

  const inviteMember = async (email: string, role: 'org:admin' | 'org:member' = 'org:member'): Promise<void> => {
    const response = await fetch('/api/family/members', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        organizationId,
        email,
        role,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to invite member');
    }

    await mutate(); // Refresh the members data
  };

  return {
    members,
    isLoading,
    error,
    updateMemberSettings,
    removeMember,
    inviteMember,
    refetch: mutate,
  };
}