import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import {
  getFamilyMembersWithClerkData,
  updateOrganizationMemberSettings,
  ensureOrganizationMemberSettings,
  ensureUserExists,
} from '@/lib/services/family-clerk-service';
import { UpdateOrganizationMemberSettingsSchema } from '@/lib/db/schemas/family-clerk';
import { query } from '@/lib/db/postgres';

// GET /api/family/members - Get family members
export async function GET(request: NextRequest) {
  try {
    const authResult = await auth();
    const { userId } = authResult;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

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

    // Get family members with Clerk data
    const members = await getFamilyMembersWithClerkData(organizationId, userId);

    return NextResponse.json({ members });

  } catch (error) {
    console.error('Error fetching family members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch family members' },
      { status: 500 }
    );
  }
}

// POST /api/family/members - Invite new family member (handled by Clerk UI/API)
// This endpoint is primarily for creating member settings after Clerk invitation
export async function POST(request: NextRequest) {
  try {
    const authResult = await auth();
    const { userId } = authResult;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { organizationId, memberUserId, memberSettings } = body;

    if (!organizationId || !memberUserId) {
      return NextResponse.json({ error: 'Organization ID and member user ID are required' }, { status: 400 });
    }

    // Verify user is an admin of the organization
    const clerkClientInstance = await clerkClient();
    const memberships = await clerkClientInstance.organizations.getOrganizationMembershipList({
      organizationId,
      limit: 100,
    });
    
    const membershipData = memberships.data || [];
    const membership = membershipData.find(m => m.publicUserData?.userId === userId);

    if (!membership || membership.role !== 'org:admin') {
      return NextResponse.json({ error: 'Only organization admins can manage member settings' }, { status: 403 });
    }

    // Ensure member user exists and get internal user ID
    const internalMemberUserId = await ensureUserExists(memberUserId);

    // Create or update member settings
    const settings = await ensureOrganizationMemberSettings(
      organizationId,
      internalMemberUserId
    );

    // Update with provided settings if any
    if (memberSettings) {
      const validatedSettings = UpdateOrganizationMemberSettingsSchema.parse(memberSettings);
      await updateOrganizationMemberSettings(
        organizationId,
        internalMemberUserId,
        validatedSettings
      );
    }

    return NextResponse.json({ settings }, { status: 201 });

  } catch (error) {
    console.error('Error creating member settings:', error);
    return NextResponse.json(
      { error: 'Failed to create member settings' },
      { status: 500 }
    );
  }
}

// PUT /api/family/members - Update member settings
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { organizationId, memberUserId, memberSettings } = body;

    if (!organizationId || !memberUserId || !memberSettings) {
      return NextResponse.json({ error: 'Organization ID, member user ID, and settings are required' }, { status: 400 });
    }

    // Ensure users exist and get internal user IDs
    const [internalUserId, internalMemberUserId] = await Promise.all([
      ensureUserExists(userId),
      ensureUserExists(memberUserId)
    ]);

    // Check permissions: admin can update any member, members can only update themselves
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

    const isAdmin = membership.role === 'org:admin';
    const isSelf = internalUserId === internalMemberUserId;

    if (!isAdmin && !isSelf) {
      return NextResponse.json({ error: 'Can only update your own settings or admin can update any member' }, { status: 403 });
    }

    // Validate and update member settings
    const validatedSettings = UpdateOrganizationMemberSettingsSchema.parse(memberSettings);
    const updatedSettings = await updateOrganizationMemberSettings(
      organizationId,
      internalMemberUserId,
      validatedSettings
    );

    return NextResponse.json({ settings: updatedSettings });

  } catch (error) {
    console.error('Error updating member settings:', error);
    return NextResponse.json(
      { error: 'Failed to update member settings' },
      { status: 500 }
    );
  }
}

// DELETE /api/family/members - Remove member from family (handled by Clerk)
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');
    const memberUserId = searchParams.get('memberUserId');

    if (!organizationId || !memberUserId) {
      return NextResponse.json({ error: 'Organization ID and member user ID are required' }, { status: 400 });
    }

    // Verify user is an admin of the organization
    const clerkClientInstance = await clerkClient();
    const memberships = await clerkClientInstance.organizations.getOrganizationMembershipList({
      organizationId,
      limit: 100,
    });
    
    const membershipData = memberships.data || [];
    const membership = membershipData.find(m => m.publicUserData?.userId === userId);

    if (!membership || membership.role !== 'org:admin') {
      return NextResponse.json({ error: 'Only organization admins can remove members' }, { status: 403 });
    }

    // Remove member from Clerk organization
    await clerkClientInstance.organizations.deleteOrganizationMembership({
      organizationId,
      userId: memberUserId,
    });

    // Clean up member settings in our database  
    try {
      const internalMemberUserId = await ensureUserExists(memberUserId);
      
      // Remove member settings
      await query(
        'DELETE FROM organization_member_settings WHERE organization_id = $1 AND user_id = $2',
        [organizationId, internalMemberUserId]
      );

      // Update user's active organization if it was this one
      await query(
        'UPDATE users SET active_organization_id = NULL WHERE id = $1 AND active_organization_id = $2',
        [internalMemberUserId, organizationId]
      );
    } catch {
      // User might not exist in our database, which is fine for deletion
      console.log('User not found in database during cleanup:', memberUserId);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error removing family member:', error);
    return NextResponse.json(
      { error: 'Failed to remove family member' },
      { status: 500 }
    );
  }
}