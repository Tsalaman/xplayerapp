# 🎯 Team Create/Join Logic - RPC Implementation

## ✅ Implementation Summary

### 1. **Database Schema**

#### **team_invites Table:**
- `id` - UUID (Primary Key)
- `team_id` - UUID (References teams)
- `created_by` - UUID (References auth.users)
- `invite_token` - TEXT (Unique, 12-character token)
- `invited_user_id` - UUID (Optional: specific user)
- `invited_email` - TEXT (Optional: invite via email)
- `accepted` - BOOLEAN (default: false)
- `accepted_by` - UUID (References auth.users)
- `accepted_at` - TIMESTAMP
- `expires_at` - TIMESTAMP (Optional: expiration)
- `max_uses` - INTEGER (default: 1)
- `uses_count` - INTEGER (default: 0)
- `created_at` - TIMESTAMP
- `updated_at` - TIMESTAMP

**File:** `TEAM_INVITES_SCHEMA.sql`

---

### 2. **SQL RPC Functions**

#### **create_team:**
```sql
CREATE OR REPLACE FUNCTION create_team(
  team_name TEXT,
  team_sport TEXT,
  team_max_players INTEGER,
  team_is_public BOOLEAN,
  team_description TEXT DEFAULT NULL,
  team_location TEXT DEFAULT NULL
)
RETURNS TABLE (...)
```
- Creates team with owner as member (trigger)
- Auto-generates invite_code for private teams (trigger)
- Returns team data with team_id

#### **join_team:**
```sql
CREATE OR REPLACE FUNCTION join_team(
  target_team_id UUID DEFAULT NULL,
  invite_token_param TEXT DEFAULT NULL
)
RETURNS TABLE (...)
```
- **Public teams:** `join_team(team_id => 'uuid')` - Direct join
- **Private teams:** `join_team(invite_token_param => 'token')` - Join with token
- Supports both `invite_code` (from teams table) and `invite_token` (from team_invites)
- Validates team capacity, duplicate members, expired tokens
- Marks invite as accepted if using token

#### **create_team_invite:**
```sql
CREATE OR REPLACE FUNCTION create_team_invite(
  target_team_id UUID,
  invited_user_id_param UUID DEFAULT NULL,
  invited_email_param TEXT DEFAULT NULL,
  expires_at_param TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  max_uses_param INTEGER DEFAULT 1
)
RETURNS TABLE (...)
```
- Only owners/captains can create invites
- Generates unique 12-character token
- Returns invite data with invite_token

**File:** `TEAM_INVITES_SCHEMA.sql`

---

### 3. **Service Layer Updates**

#### **services/teams.ts:**

```typescript
// Create team via RPC
createTeam: async (teamData, userId, userNickname) => {
  const { data } = await supabase.rpc('create_team', {...});
  return mappedTeam;
}

// Join team via RPC (unified for public/private)
joinTeam: async (inviteToken?: string, teamId?: string) => {
  const { data } = await supabase.rpc('join_team', {
    target_team_id: teamId || null,
    invite_token_param: inviteToken || null,
  });
  return TeamMember;
}

// Create team invite via RPC
createTeamInvite: async (teamId, options?) => {
  const { data } = await supabase.rpc('create_team_invite', {...});
  return InviteData;
}
```

**Backward Compatibility:**
- `joinTeamByInvite()` - Uses `joinTeam()` internally
- `joinPublicTeam()` - Uses `joinTeam()` internally

---

### 4. **UI Updates**

#### **app/(tabs)/teams.tsx:**
- ✅ `handleJoinPublicTeam()` - Uses `teamService.joinTeam(undefined, teamId)`
- ✅ `handleJoinPrivateTeam()` - Uses `teamService.joinTeam(inviteCode)`

#### **app/team/join.tsx:**
- ✅ Updated to use `teamService.joinTeam(inviteCode)`

#### **app/team/manage.tsx:**
- ✅ Added `handleCreateInvite()` - Creates new invite tokens
- ✅ Added `handleShareInviteToken()` - Shares invite token links
- ✅ UI shows both invite_code (legacy) and create invite button

---

## 🔄 Flow

### **Create Team:**
1. User fills form (name, sport, max_players, public/private)
2. Call `teamService.createTeam()` → RPC `create_team()`
3. RPC creates team + adds owner as member (trigger)
4. If private → auto-generates invite_code (trigger)
5. Returns team with `team_id`
6. Redirect to `/team/manage?id={team_id}`

### **Join Public Team:**
1. User clicks "Join" on public team
2. Call `teamService.joinTeam(undefined, teamId)`
3. RPC validates: public, not full, not already member
4. Adds user as member with role 'player'
5. Returns member data
6. Redirect to team management

### **Join Private Team (via invite code):**
1. User enters invite code
2. Call `teamService.joinTeam(inviteCode)`
3. RPC finds team by `invite_code` OR `invite_token`
4. Validates: team exists, not full, not already member
5. If using token → marks invite as accepted
6. Adds user as member
7. Returns member data
8. Redirect to team management

### **Create Team Invite:**
1. Owner/Captain clicks "Create New Invite"
2. Call `teamService.createTeamInvite(teamId, options)`
3. RPC validates: user is owner/captain
4. Generates unique token
5. Creates invite record
6. Returns invite with token
7. Share token/link via QR code or message

---

## 📱 UI Features

### **Teams List:**
- ✅ Public teams → Direct "Join" button
- ✅ Private teams → Invite code input + "Join" button
- ✅ Both use `joinTeam()` RPC

### **Team Management:**
- ✅ Shows team invite_code (legacy, for private teams)
- ✅ "Create New Invite" button (for owners/captains)
- ✅ Share invite token link
- ✅ QR code generation for invite tokens

---

## ✅ Benefits

✅ **Unified Logic** - Single `join_team` RPC for all join scenarios  
✅ **Token-Based Invites** - Flexible invite system with expiration, max uses  
✅ **Backward Compatible** - Legacy invite_code still works  
✅ **Secure** - RLS policies ensure only authorized users can create/join  
✅ **Scalable** - RPC functions handle all validation server-side  
✅ **Type Safe** - TypeScript interfaces for all data types  

---

## 🎯 Summary

- ✅ `team_invites` table created
- ✅ RPC functions: `create_team`, `join_team`, `create_team_invite`
- ✅ Services updated to use RPC
- ✅ UI updated to use new services
- ✅ Backward compatibility maintained
- ✅ Invite token system ready for use

**All logic implemented correctly! 🎉**

