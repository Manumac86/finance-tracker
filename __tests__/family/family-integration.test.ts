/**
 * Family Integration Tests
 * Tests the complete family functionality using Clerk Organizations
 */

// Remove jest import - it's available globally in test environment
import { NextRequest, NextResponse } from 'next/server';
import {
  GET as getFamilyRoute,
  POST as createFamilyRoute,
  PUT as updateFamilyRoute,
  DELETE as deleteFamilyRoute,
} from '@/app/api/family/route';
import {
  GET as getFamilyMembersRoute,
  POST as createMemberRoute,
  PUT as updateMemberRoute,
  DELETE as removeMemberRoute,
} from '@/app/api/family/members/route';
import { POST as switchFamilyRoute } from '@/app/api/family/switch/route';

// Mock the clerk client instance
const mockClerkClientInstance = {
  organizations: {
    createOrganization: jest.fn(),
    updateOrganization: jest.fn(),
    deleteOrganization: jest.fn(),
    getOrganization: jest.fn(),
    getOrganizationMembership: jest.fn(),
    getOrganizationMembershipList: jest.fn(),
    deleteOrganizationMembership: jest.fn(),
  },
  users: {
    getUser: jest.fn(),
    getOrganizationMembershipList: jest.fn(),
  },
};

// Mock Clerk
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
  clerkClient: jest.fn(() => Promise.resolve(mockClerkClientInstance)),
}));

// Mock database
jest.mock('@/lib/db/postgres', () => ({
  query: jest.fn(),
}));

// Mock family service
jest.mock('@/lib/services/family-clerk-service', () => ({
  getFamilyGroupWithClerkData: jest.fn(),
  createFamilySettings: jest.fn(),
  updateFamilySettings: jest.fn(),
  updateUserActiveOrganization: jest.fn(),
  getUserActiveOrganization: jest.fn(),
  ensureUserExists: jest.fn(),
  getFamilyMembersWithClerkData: jest.fn(),
  updateOrganizationMemberSettings: jest.fn(),
  ensureOrganizationMemberSettings: jest.fn(),
}));

// Import the mocked functions after the mock definition
const {
  getFamilyGroupWithClerkData: mockGetFamilyGroupWithClerkData,
  createFamilySettings: mockCreateFamilySettings,
  updateFamilySettings: mockUpdateFamilySettings,
  updateUserActiveOrganization: mockUpdateUserActiveOrganization,
  getUserActiveOrganization: mockGetUserActiveOrganization,
  ensureUserExists: mockEnsureUserExists,
  getFamilyMembersWithClerkData: mockGetFamilyMembersWithClerkData,
  updateOrganizationMemberSettings: mockUpdateOrganizationMemberSettings,
  ensureOrganizationMemberSettings: mockEnsureOrganizationMemberSettings,
} = jest.requireMock('@/lib/services/family-clerk-service');

// Mock schemas
jest.mock('@/lib/db/schemas/family-clerk', () => ({
  CreateFamilySettingsSchema: {
    parse: jest.fn((data) => data),
  },
  UpdateFamilySettingsSchema: {
    parse: jest.fn((data) => data),
  },
  UpdateOrganizationMemberSettingsSchema: {
    parse: jest.fn((data) => data),
  },
}));

import { auth, clerkClient } from '@clerk/nextjs/server';
import { query } from '@/lib/db/postgres';

describe('Family Integration Tests', () => {
  const mockUserId = 'user_test123';
  const mockInternalUserId = 'uuid-internal-123';
  const mockOrganizationId = 'org_test456';
  const mockFamilyGroup = {
    organizationId: mockOrganizationId,
    name: 'Test Family',
    settings: {
      id: 'settings-123',
      organizationId: mockOrganizationId,
      sharedCurrency: 'USD',
      permissions: {
        membersCanViewAllTransactions: true,
        membersCanEditSharedBudgets: false,
        membersCanCreateSharedGoals: true,
        requireAdminApprovalForLargeExpenses: false,
        largeExpenseThreshold: 100,
        allowIndividualBudgets: true,
        spendingNotificationsEnabled: true,
      },
    },
    memberCount: 2,
    adminCount: 1,
    totalMonthlySpending: 1500,
    totalMonthlyIncome: 3000,
    budgetUtilization: 75,
    sharedGoalsCount: 2,
    sharedBudgetsCount: 3,
    currentUserRole: 'org:admin' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.MockedFunction<typeof auth>).mockResolvedValue({ 
      userId: mockUserId,
    } as any);
    mockEnsureUserExists.mockResolvedValue(mockInternalUserId);
  });

  describe('Family CRUD Operations', () => {
    test('GET /api/family - should get active family group', async () => {
      mockGetUserActiveOrganization.mockResolvedValue(mockOrganizationId);
      mockGetFamilyGroupWithClerkData.mockResolvedValue(mockFamilyGroup);

      const request = new NextRequest('http://localhost:3000/api/family');
      const response = await getFamilyRoute(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.familyGroup).toEqual(mockFamilyGroup);
      expect(mockEnsureUserExists).toHaveBeenCalledWith(mockUserId);
      expect(mockGetUserActiveOrganization).toHaveBeenCalledWith(mockInternalUserId);
      expect(mockGetFamilyGroupWithClerkData).toHaveBeenCalledWith(mockOrganizationId, mockUserId);
    });

    test('GET /api/family?action=list - should list all user organizations', async () => {
      const mockOrganizations = [
        { organization: { id: 'org_1' } },
        { organization: { id: 'org_2' } },
      ];
      
      mockClerkClientInstance.users.getOrganizationMembershipList.mockResolvedValue({ data: mockOrganizations });
      mockGetFamilyGroupWithClerkData.mockResolvedValue(mockFamilyGroup);

      const request = new NextRequest('http://localhost:3000/api/family?action=list');
      const response = await getFamilyRoute(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.familyGroups).toHaveLength(2);
      expect(mockClerkClientInstance.users.getOrganizationMembershipList).toHaveBeenCalledWith({
        userId: mockUserId,
        limit: 50,
      });
    });

    test('POST /api/family - should create new family organization', async () => {
      const mockOrganization = {
        id: mockOrganizationId,
        name: 'New Family',
      };
      
      mockClerkClientInstance.organizations.createOrganization.mockResolvedValue(mockOrganization);
      mockCreateFamilySettings.mockResolvedValue(mockFamilyGroup.settings);
      mockGetFamilyGroupWithClerkData.mockResolvedValue(mockFamilyGroup);

      const request = new NextRequest('http://localhost:3000/api/family', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Family',
          slug: 'new-family',
          familySettings: {
            shared_currency: 'EUR',
          },
        }),
      });

      const response = await createFamilyRoute(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.familyGroup).toEqual(mockFamilyGroup);
      expect(mockClerkClientInstance.organizations.createOrganization).toHaveBeenCalledWith({
        name: 'New Family',
        slug: 'new-family',
        createdBy: mockUserId,
      });
      expect(mockCreateFamilySettings).toHaveBeenCalled();
      expect(mockUpdateUserActiveOrganization).toHaveBeenCalledWith(mockInternalUserId, mockOrganizationId);
    });

    test('PUT /api/family - should update family settings', async () => {
      mockClerkClientInstance.organizations.getOrganizationMembershipList.mockResolvedValue({ 
        data: [{ publicUserData: { userId: mockUserId }, role: 'org:admin' }] 
      });
      mockGetFamilyGroupWithClerkData.mockResolvedValue(mockFamilyGroup);

      const request = new NextRequest('http://localhost:3000/api/family', {
        method: 'PUT',
        body: JSON.stringify({
          organizationId: mockOrganizationId,
          name: 'Updated Family Name',
          familySettings: {
            shared_currency: 'EUR',
          },
        }),
      });

      const response = await updateFamilyRoute(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.familyGroup).toEqual(mockFamilyGroup);
      expect(mockClerkClientInstance.organizations.updateOrganization).toHaveBeenCalledWith(
        mockOrganizationId,
        { name: 'Updated Family Name', slug: undefined }
      );
      expect(mockUpdateFamilySettings).toHaveBeenCalled();
    });

    test('DELETE /api/family - should delete family organization', async () => {
      mockClerkClientInstance.organizations.getOrganizationMembershipList.mockResolvedValue({ 
        data: [{ publicUserData: { userId: mockUserId }, role: 'org:admin' }] 
      });
      (query as jest.MockedFunction<typeof query>).mockResolvedValue([]);

      const request = new NextRequest(
        `http://localhost:3000/api/family?organizationId=${mockOrganizationId}`,
        { method: 'DELETE' }
      );

      const response = await deleteFamilyRoute(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockClerkClientInstance.organizations.deleteOrganization).toHaveBeenCalledWith(mockOrganizationId);
    });
  });

  describe('Family Members Management', () => {
    test('GET /api/family/members - should get family members', async () => {
      const mockMembers = [
        {
          clerkUserId: 'user_1',
          email: 'user1@example.com',
          role: 'org:admin',
          displayName: 'User One',
          isCurrentUser: true,
        },
        {
          clerkUserId: 'user_2',
          email: 'user2@example.com',
          role: 'org:member',
          displayName: 'User Two',
          isCurrentUser: false,
        },
      ];

      mockClerkClientInstance.organizations.getOrganizationMembershipList.mockResolvedValue({ 
        data: [{ publicUserData: { userId: mockUserId }, role: 'org:admin' }] 
      });
      mockGetFamilyMembersWithClerkData.mockResolvedValue(mockMembers);

      const request = new NextRequest(
        `http://localhost:3000/api/family/members?organizationId=${mockOrganizationId}`
      );

      const response = await getFamilyMembersRoute(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.members).toEqual(mockMembers);
      expect(mockGetFamilyMembersWithClerkData).toHaveBeenCalledWith(mockOrganizationId, mockUserId);
    });

    test('PUT /api/family/members - should update member settings', async () => {
      const mockMemberUserId = 'user_member123';
      const mockMemberInternalId = 'uuid-member-456';
      const mockUpdatedSettings = {
        id: 'settings-456',
        organizationId: mockOrganizationId,
        userId: mockMemberInternalId,
        displayName: 'Updated Name',
        canViewAllAccounts: true,
        receiveSpendingNotifications: false,
      };

      mockEnsureUserExists
        .mockResolvedValueOnce(mockInternalUserId)
        .mockResolvedValueOnce(mockMemberInternalId);
      mockClerkClientInstance.organizations.getOrganizationMembershipList.mockResolvedValue({ 
        data: [{ publicUserData: { userId: mockUserId }, role: 'org:admin' }] 
      });
      mockUpdateOrganizationMemberSettings.mockResolvedValue(mockUpdatedSettings);

      const request = new NextRequest('http://localhost:3000/api/family/members', {
        method: 'PUT',
        body: JSON.stringify({
          organizationId: mockOrganizationId,
          memberUserId: mockMemberUserId,
          memberSettings: {
            displayName: 'Updated Name',
            canViewAllAccounts: true,
            receiveSpendingNotifications: false,
          },
        }),
      });

      const response = await updateMemberRoute(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.settings).toEqual(mockUpdatedSettings);
      expect(mockUpdateOrganizationMemberSettings).toHaveBeenCalledWith(
        mockOrganizationId,
        mockMemberInternalId,
        expect.objectContaining({
          displayName: 'Updated Name',
          canViewAllAccounts: true,
          receiveSpendingNotifications: false,
        })
      );
    });
  });

  describe('Family Organization Switching', () => {
    test('POST /api/family/switch - should switch to organization', async () => {
      mockClerkClientInstance.organizations.getOrganizationMembershipList.mockResolvedValue({ 
        data: [{ publicUserData: { userId: mockUserId }, role: 'org:member' }] 
      });
      mockGetFamilyGroupWithClerkData.mockResolvedValue(mockFamilyGroup);

      const request = new NextRequest('http://localhost:3000/api/family/switch', {
        method: 'POST',
        body: JSON.stringify({
          organizationId: mockOrganizationId,
        }),
      });

      const response = await switchFamilyRoute(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Switched to family organization');
      expect(data.familyGroup).toEqual(mockFamilyGroup);
      expect(mockUpdateUserActiveOrganization).toHaveBeenCalledWith(mockInternalUserId, mockOrganizationId);
    });

    test('POST /api/family/switch - should switch to individual mode', async () => {
      const request = new NextRequest('http://localhost:3000/api/family/switch', {
        method: 'POST',
        body: JSON.stringify({
          organizationId: null,
        }),
      });

      const response = await switchFamilyRoute(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Switched to individual mode');
      expect(data.familyGroup).toBeNull();
      expect(mockUpdateUserActiveOrganization).toHaveBeenCalledWith(mockInternalUserId, null);
    });
  });

  describe('Error Handling', () => {
    test('should handle unauthorized requests', async () => {
      (auth as jest.MockedFunction<typeof auth>).mockResolvedValue({ 
        userId: null,
      } as any);

      const request = new NextRequest('http://localhost:3000/api/family');
      const response = await getFamilyRoute(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    test('should handle non-admin trying to delete family', async () => {
      mockClerkClientInstance.organizations.getOrganizationMembershipList.mockResolvedValue({ 
        data: [{ publicUserData: { userId: mockUserId }, role: 'org:member' }] 
      });

      const request = new NextRequest(
        `http://localhost:3000/api/family?organizationId=${mockOrganizationId}`,
        { method: 'DELETE' }
      );

      const response = await deleteFamilyRoute(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Only organization admins can delete family groups');
    });

    test('should handle missing organization ID in members request', async () => {
      const request = new NextRequest('http://localhost:3000/api/family/members');
      const response = await getFamilyMembersRoute(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Organization ID is required');
    });
  });

  describe('Permission Validation', () => {
    test('should validate admin permissions for family settings update', async () => {
      mockClerkClientInstance.organizations.getOrganizationMembershipList.mockResolvedValue({ 
        data: [{ publicUserData: { userId: mockUserId }, role: 'org:member' }] 
      }); // Non-admin role

      const request = new NextRequest('http://localhost:3000/api/family', {
        method: 'PUT',
        body: JSON.stringify({
          organizationId: mockOrganizationId,
          name: 'Updated Family Name',
        }),
      });

      const response = await updateFamilyRoute(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Only organization admins can update settings');
    });

    test('should validate member permissions for member settings update', async () => {
      const differentUserId = 'user_different789';
      const differentInternalId = 'uuid-different-789';
      
      mockEnsureUserExists
        .mockResolvedValueOnce(mockInternalUserId)
        .mockResolvedValueOnce(differentInternalId);
      mockClerkClientInstance.organizations.getOrganizationMembershipList.mockResolvedValue({ 
        data: [{ publicUserData: { userId: mockUserId }, role: 'org:member' }] 
      }); // Non-admin role

      const request = new NextRequest('http://localhost:3000/api/family/members', {
        method: 'PUT',
        body: JSON.stringify({
          organizationId: mockOrganizationId,
          memberUserId: differentUserId, // Different user
          memberSettings: {
            displayName: 'Updated Name',
          },
        }),
      });

      const response = await updateMemberRoute(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Can only update your own settings or admin can update any member');
    });
  });
});