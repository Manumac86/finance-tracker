import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import {
  updateUserActiveOrganization,
  getFamilyGroupWithClerkData,
  ensureUserExists,
} from '@/lib/services/family-clerk-service';

// POST /api/family/switch - Switch active family organization
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { organizationId } = body;

    // Ensure user exists and get internal user ID
    const internalUserId = await ensureUserExists(userId);

    if (organizationId) {
      // Verify user is a member of the organization
      const clerkClientInstance = await clerkClient();
      const memberships = await clerkClientInstance.organizations.getOrganizationMembershipList({
        organizationId,
        limit: 100,
      });
      
      const membershipData = memberships.data || [];
      const membership = membershipData.find(m => m.publicUserData?.userId === userId);

      if (!membership) {
        return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 });
      }

      // Switch to the organization
      await updateUserActiveOrganization(internalUserId, organizationId);

      // Get updated family group data
      const familyGroup = await getFamilyGroupWithClerkData(organizationId, userId);

      return NextResponse.json({ 
        message: 'Switched to family organization',
        familyGroup 
      });
    } else {
      // Switch to individual mode (no active organization)
      await updateUserActiveOrganization(internalUserId, null);

      return NextResponse.json({ 
        message: 'Switched to individual mode',
        familyGroup: null 
      });
    }

  } catch (error) {
    console.error('Error switching family organization:', error);
    return NextResponse.json(
      { error: 'Failed to switch family organization' },
      { status: 500 }
    );
  }
}