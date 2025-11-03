# 🔄 Cursor Pagination Guide

## ✅ Τι Έγινε

### 1. **Cursor Utilities** (`utils/cursor.ts`)
- ✅ `encodeCursor()` - Encode object to base64
- ✅ `decodeCursor()` - Decode base64 to object
- ✅ `createTimestampCursor()` - Simple timestamp cursor
- ✅ `createComplexCursor()` - Multi-field cursor (distance + id)
- ✅ Helper functions for cursor extraction

### 2. **Services Updated**
- ✅ `postService.getPostsPaginated()` - Cursor pagination for posts
- ✅ `tournamentService.getTournamentsPaginated()` - Cursor pagination for tournaments
- ✅ `search_nearby()` SQL function - Complex cursor for distance-based pagination

### 3. **React Hooks**
- ✅ `usePagination()` - Generic pagination hook
- ✅ `useMatchmaking()` - Updated with cursor support

### 4. **Screens Updated**
- ✅ `app/(tabs)/posts.tsx` - Infinite scroll with cursor pagination

---

## 📖 How It Works

### Basic Cursor Pagination:

```typescript
// 1st Page: cursor = null
const page1 = await postService.getPostsPaginated(20, null);

// 2nd Page: cursor = nextCursor from page1
const page2 = await postService.getPostsPaginated(20, page1.nextCursor);

// Continue until hasMore = false
```

### SQL Query Pattern:
```sql
SELECT * FROM posts
WHERE status = 'open'
  AND (:cursor IS NULL OR created_at < :cursor)
ORDER BY created_at DESC
LIMIT :limit;
```

### Complex Cursor (Distance + ID):
```typescript
// For distance-based sorting
const cursor = encodeCursor({ distance: 5.2, id: 'user-123' });

// SQL uses:
WHERE (distance > cursor_distance) 
   OR (distance = cursor_distance AND id > cursor_id)
ORDER BY distance ASC, id ASC
```

---

## 🎯 Usage Examples

### Posts Screen:
```typescript
const { items, loading, hasMore, loadMore, refresh } = usePagination({
  fetchPage: async (cursor, limit) => {
    return await postService.getPostsPaginated(limit, cursor);
  },
  limit: 20,
});

// In FlatList:
<FlatList
  data={items}
  onEndReached={() => hasMore && loadMore()}
  onEndReachedThreshold={0.5}
/>
```

### Nearby Search:
```typescript
const { nearbyUsers, loadMore, hasMore } = useMatchmaking({
  radiusKm: 10,
  limit: 20,
});

// Load more:
if (hasMore) {
  loadMore(); // Uses complex cursor internally
}
```

---

## 🔧 Implementation Details

### Advantages:
- ✅ **No OFFSET** - Faster queries
- ✅ **Stable** - No duplicates when data changes
- ✅ **Efficient** - Works with large datasets
- ✅ **Scalable** - Performance doesn't degrade

### Cursor Format:
- **Simple**: `{ timestamp: "2024-01-15T10:30:00Z" }`
- **Complex**: `{ distance: 5.2, id: "uuid-123" }`
- **Encoded**: Base64 JSON string

### Pagination Flow:
1. Client requests page with `cursor = null`
2. Server returns `data` + `nextCursor` + `hasMore`
3. Client uses `nextCursor` for next page
4. Repeat until `hasMore = false`

---

## 📝 Files Created/Updated

### Created:
- `utils/cursor.ts` - Cursor utilities
- `hooks/usePagination.ts` - Generic pagination hook
- `PAGINATION_GUIDE.md` - This guide

### Updated:
- `services/api.ts` - Paginated service methods
- `hooks/useMatchmaking.ts` - Cursor support
- `NEARBY_SEARCH.sql` - Cursor parameters
- `app/(tabs)/posts.tsx` - Infinite scroll

---

## ✅ Next Steps

1. **Update Other Screens:**
   - `app/(tabs)/tournaments.tsx` - Add pagination
   - `app/nearby/index.tsx` - Use `loadMore()` from hook

2. **Optional Enhancements:**
   - Add "Load More" button (alternative to infinite scroll)
   - Add loading indicators
   - Add error retry logic

---

## 🎉 Benefits

- ⚡ **Faster** - No OFFSET queries
- 🔒 **Stable** - No duplicate results
- 📈 **Scalable** - Works with millions of records
- 🎯 **Efficient** - Only fetches what's needed

**Happy Paginating! 🚀**

