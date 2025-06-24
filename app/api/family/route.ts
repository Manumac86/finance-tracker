import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import {
  getFamilyGroupWithClerkData,
  createFamilySettings,
  updateFamilySettings,
  updateUserActiveOrganization,
  getUserActiveOrganization,
  ensureUserExists,
} from '@/lib/services/family-clerk-service';
import { CreateFamilySettingsSchema, UpdateFamilySettingsSchema } from '@/lib/db/schemas/family-clerk';
import { query } from '@/lib/db/postgres';

// GET /api/family - Get current user's active family or list of organizations
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    // For list action, just get user's organizations from Clerk
    if (action === 'list') {
      try {
        const clerkClientInstance = await clerkClient();
        const organizations = await clerkClientInstance.users.getOrganizationMembershipList({
          userId,
          limit: 50,
        });

        const organizationData = organizations.data || [];
        const familyGroups = [];
        for (const membership of organizationData) {
          const familyGroup = await getFamilyGroupWithClerkData(
            membership.organization.id,
            userId
          );
          if (familyGroup) {
            familyGroups.push(familyGroup);
          }
        }

        return NextResponse.json({ familyGroups });
      } catch (error) {
        console.error('Error getting organization list:', error);
        return NextResponse.json({ familyGroups: [] });
      }
    }

    // For default action, check if user has an active organization
    try {
      // Ensure user exists and get internal user ID
      const internalUserId = await ensureUserExists(userId);
      
      // Get user's active organization
      const activeOrgId = await getUserActiveOrganization(internalUserId);

      if (!activeOrgId) {
        // User has no active organization
        return NextResponse.json({ familyGroup: null });
      }

      // Get family group data with Clerk information
      const familyGroup = await getFamilyGroupWithClerkData(activeOrgId, userId);

      if (!familyGroup) {
        return NextResponse.json({ familyGroup: null });
      }

      return NextResponse.json({ familyGroup });
    } catch (dbError) {
      console.error('Database not ready, returning no family group:', dbError);
      // If database isn't set up, just return no family group
      return NextResponse.json({ familyGroup: null });
    }

  } catch (error) {
    console.error('Error fetching family group:', error);
    return NextResponse.json(
      { error: 'Failed to fetch family group' },
      { status: 500 }
    );
  }
}

// POST /api/family - Create new family organization
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, familySettings } = body;

    if (!name) {
      return NextResponse.json({ error: 'Family name is required' }, { status: 400 });
    }

    // Create Clerk organization
    const clerkClientInstance = await clerkClient();
    let organization;
    
    try {
      organization = await clerkClientInstance.organizations.createOrganization({
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        createdBy: userId,
      });
    } catch (clerkError) {
      const error = clerkError as { status?: number; errors?: Array<{ code?: string; message?: string }>; message?: string };
      console.error('Clerk organization creation error:', {
        status: error.status,
        errors: error.errors,
        message: error.message,
      });
      
      // Check if it's a slug conflict
      if (error.status === 422 && error.errors?.some((e) => e.code === 'form_param_format_invalid' || e.message?.includes('slug'))) {
        return NextResponse.json({ 
          error: 'Organization slug already exists or is invalid. Please choose a different name.' 
        }, { status: 400 });
      }
      
      throw clerkError;
    }

    try {
      // Create family settings in our database
      const defaultSettings = {
        organization_id: organization.id,
        shared_currency: 'USD',
        permissions: {
          members_can_view_all_transactions: true,
          members_can_edit_shared_budgets: false,
          members_can_create_shared_goals: true,
          require_admin_approval_for_large_expenses: false,
          large_expense_threshold: 100.00,
          allow_individual_budgets: true,
          spending_notifications_enabled: true,
        },
        ...familySettings,
      };

      const validatedSettings = CreateFamilySettingsSchema.parse(defaultSettings);
      await createFamilySettings(organization.id, validatedSettings);

      // Update user's active organization
      const userInternalId = await ensureUserExists(userId);
      await updateUserActiveOrganization(userInternalId, organization.id);

      // Get the complete family group data
      const familyGroup = await getFamilyGroupWithClerkData(organization.id, userId);

      return NextResponse.json({ familyGroup }, { status: 201 });
    } catch (dbError) {
      console.error('Database error during family creation:', dbError);
      
      // If database setup fails, still return the basic organization info
      const basicFamilyGroup = {
        organizationId: organization.id,
        name: organization.name,
        slug: organization.slug,
        imageUrl: organization.imageUrl,
        createdAt: new Date(organization.createdAt).toISOString(),
        updatedAt: new Date(organization.updatedAt).toISOString(),
        memberCount: 1,
        adminCount: 1,
        currentUserRole: "org:admin",
        settings: {
          id: 'default',
          organizationId: organization.id,
          sharedCurrency: 'USD',
          monthlyFamilyBudget: undefined,
          permissions: {
            membersCanViewAllTransactions: true,
            membersCanEditSharedBudgets: false,
            membersCanCreateSharedGoals: true,
            requireAdminApprovalForLargeExpenses: false,
            largeExpenseThreshold: 100.00,
            allowIndividualBudgets: true,
            spendingNotificationsEnabled: true,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        totalMonthlySpending: 0,
        totalMonthlyIncome: 0,
        budgetUtilization: 0,
        sharedGoalsCount: 0,
        sharedBudgetsCount: 0,
      };

      return NextResponse.json({ familyGroup: basicFamilyGroup }, { status: 201 });
    }

  } catch (error) {
    console.error('Error creating family group:', error);
    return NextResponse.json(
      { error: 'Failed to create family group' },
      { status: 500 }
    );
  }
}

// PUT /api/family - Update family settings
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { organizationId, ...updateData } = body;

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
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
      return NextResponse.json({ error: 'Only organization admins can update settings' }, { status: 403 });
    }

    // Update Clerk organization if name or slug provided
    const { name, slug, familySettings } = updateData;
    if (name || slug) {
      await clerkClientInstance.organizations.updateOrganization(organizationId, {
        name,
        slug,
      });
    }

    // Update family settings if provided
    if (familySettings) {
      const validatedSettings = UpdateFamilySettingsSchema.parse(familySettings);
      await updateFamilySettings(organizationId, validatedSettings);
    }

    // Get updated family group data
    const familyGroup = await getFamilyGroupWithClerkData(organizationId, userId);

    return NextResponse.json({ familyGroup });

  } catch (error) {
    console.error('Error updating family group:', error);
    return NextResponse.json(
      { error: 'Failed to update family group' },
      { status: 500 }
    );
  }
}

// DELETE /api/family - Delete family organization
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
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
      return NextResponse.json({ error: 'Only organization admins can delete family groups' }, { status: 403 });
    }

    // Delete Clerk organization (this will cascade to memberships)
    await clerkClientInstance.organizations.deleteOrganization(organizationId);

    // Clean up our database (family settings will be cleaned up by foreign key constraints)
    await query(
      'DELETE FROM family_settings WHERE organization_id = $1',
      [organizationId]
    );

    // Update users who had this as their active organization
    await query(
      'UPDATE users SET active_organization_id = NULL WHERE active_organization_id = $1',
      [organizationId]
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting family group:', error);
    return NextResponse.json(
      { error: 'Failed to delete family group' },
      { status: 500 }
    );
  }
}