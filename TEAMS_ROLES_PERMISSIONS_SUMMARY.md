# 👥 Team Roles & Permissions - Implementation Summary

## ✅ Implementation Complete

### 1. **Roles**

- ✅ **owner**: Full rights (promote/demote, remove anyone, transfer ownership, delete team)
- ✅ **captain**: Manage players (promote player to captain, remove players only)
- ✅ **player**: No management rights

---

### 2. **RPC Functions** (`TEAMS_ROLES_RPC.sql`)

#### **update_member_role:**
- ✅ Owner: Can promote/demote captain/player
- ✅ Captain: Can only promote player to captain (cannot demote captain)
- ✅ Validates permissions before update
- ✅ Cannot change owner role

#### **remove_member:**
- ✅ Owner: Can remove anyone (except owner)
- ✅ Captain: Can only remove players (not owner/captain)
- ✅ Validates permissions before removal
- ✅ Cannot remove owner

#### **transfer_ownership:**
- ✅ Only owner can transfer ownership
- ✅ Cannot transfer to self
- ✅ Transfers team ownership and updates roles:
  - Old owner → player
  - New owner → owner
- ✅ Updates team.owner_id and team.owner_nickname

---

### 3. **Service Updates** (`services/teams.ts`)

#### **Updated Methods:**
- ✅ `removeMember(teamId, memberId)` - Now uses RPC (removed userId parameter)
- ✅ `updateMemberRole(teamId, memberId, role)` - Now uses RPC (removed userId parameter)
- ✅ `transferOwnership(teamId, newOwnerMemberId)` - New method via RPC

#### **Benefits:**
- Security checks happen at database level (RPC functions)
- Simplified service methods (no need to pass userId)
- Consistent error handling

---

### 4. **UI Updates** (`app/team/manage.tsx`)

#### **Roster Display:**
- ✅ **Sorted by Roles**: OWNER, CAPTAINS, PLAYERS
- ✅ **Role Sections**: Clear section headers for each role group
- ✅ **Role Badges**: Color-coded badges (owner=primary, captain=secondary, player=textSecondary)

#### **Member Options Menu:**
- ✅ **Three-dot menu** (ellipsis-vertical) for each manageable member
- ✅ **Modal menu** with action buttons
- ✅ **Actions shown based on permissions**:
  - **Promote to Captain** (owner only, for players)
  - **Demote to Player** (owner only, for captains)
  - **Transfer Ownership** (owner only, for non-owner members)
  - **Remove from Team** (owner/captain based on permissions)

#### **Permission Logic:**
- ✅ `canManageMember()` - Checks if user can see options menu
- ✅ `canPromoteDemote()` - Checks if user can promote/demote (owner only)
- ✅ `canRemoveMember()` - Checks if user can remove member

#### **UI Rules:**
- ✅ **Owner/Captain only** see "Manage Team" screen
- ✅ **Owner can**:
  - Promote/demote captain/player
  - Transfer ownership (to non-owner)
  - Remove anyone (except owner)
  - Delete team
- ✅ **Captain can**:
  - Promote player to captain
  - Remove only players (not owner/captain)
- ✅ **Player**:
  - No management buttons visible

---

### 5. **Permission Matrix**

| Action | Owner | Captain | Player |
|--------|-------|---------|--------|
| View Team | ✅ | ✅ | ✅ |
| Promote to Captain | ✅ | ✅ (players only) | ❌ |
| Demote to Player | ✅ | ❌ | ❌ |
| Remove Player | ✅ | ✅ | ❌ |
| Remove Captain | ✅ | ❌ | ❌ |
| Remove Owner | ❌ | ❌ | ❌ |
| Transfer Ownership | ✅ | ❌ | ❌ |
| Delete Team | ✅ | ❌ | ❌ |
| Create Invite | ✅ | ✅ | ❌ |

---

### 6. **Security**

#### **RPC-Level Security:**
- ✅ All permission checks in RPC functions
- ✅ Validates user authentication
- ✅ Validates user role before actions
- ✅ Validates target member role
- ✅ Prevents self-management (except leaving)

#### **UI-Level Security:**
- ✅ Buttons hidden based on permissions (UX only)
- ✅ RPC functions enforce actual security
- ✅ Even if UI is bypassed, RPC blocks unauthorized actions

---

### 7. **Files Created/Updated**

#### **Created:**
- ✅ `TEAMS_ROLES_RPC.sql` - RPC functions for role management
- ✅ `TEAMS_ROLES_PERMISSIONS_SUMMARY.md` - This document

#### **Updated:**
- ✅ `services/teams.ts` - Updated methods to use RPC functions
- ✅ `app/team/manage.tsx` - Complete UI overhaul with:
  - Sorted roster by roles
  - Options menu for each member
  - Permission-based action visibility
  - Transfer ownership functionality

---

### 8. **Usage Examples**

#### **Promote to Captain:**
```typescript
// Only owner can promote
await teamService.updateMemberRole(teamId, memberId, 'captain');
```

#### **Demote to Player:**
```typescript
// Only owner can demote
await teamService.updateMemberRole(teamId, memberId, 'player');
```

#### **Remove Member:**
```typescript
// Owner: can remove anyone (except owner)
// Captain: can remove players only
await teamService.removeMember(teamId, memberId);
```

#### **Transfer Ownership:**
```typescript
// Only owner can transfer
await teamService.transferOwnership(teamId, newOwnerMemberId);
// Old owner → player
// New owner → owner
// Team.owner_id updated
```

---

### 9. **Setup Instructions**

#### **Step 1: Run RPC Functions**
```bash
# In Supabase SQL Editor, run:
TEAMS_ROLES_RPC.sql
```

#### **Step 2: Verify Permissions**
- Test with owner account
- Test with captain account
- Test with player account
- Verify UI shows/hides actions correctly
- Verify RPC functions block unauthorized actions

---

### 10. **UI Features**

#### **Roster Sections:**
```
Team Roster
  OWNER
    👤 John (Owner) [menu]
  
  CAPTAINS
    👤 Jane (Captain) [menu]
    👤 Bob (Captain)
  
  PLAYERS
    👤 Alice (Player) [menu]
    👤 Charlie (Player)
```

#### **Member Options Menu:**
```
[Modal from bottom]
  👤 John
  Captain
  
  [Promote to Captain] / [Demote to Player]
  [Transfer Ownership]
  [Remove from Team]
  
  [Cancel]
```

---

### 11. **Error Handling**

#### **RPC Errors:**
- ✅ "Only team owner or captain can update member roles"
- ✅ "Captains cannot demote other captains"
- ✅ "Captains can only remove players"
- ✅ "Cannot remove team owner"
- ✅ "Cannot change owner role"
- ✅ "Only team owner can transfer ownership"

#### **UI Error Messages:**
- ✅ Shows Alert with error message from RPC
- ✅ User-friendly error messages
- ✅ Prevents invalid actions

---

## 🎉 Implementation Complete!

The Team Roles & Permissions system is now fully implemented with:
- ✅ Three roles: owner, captain, player
- ✅ Roster sorted by roles (OWNER, CAPTAINS, PLAYERS)
- ✅ Options menu for each member
- ✅ Permission-based action visibility
- ✅ RPC-level security checks
- ✅ Transfer ownership functionality
- ✅ Beautiful UX with proper feedback

**Happy Managing! 👥**

