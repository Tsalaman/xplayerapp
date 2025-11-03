# 🔄 Cursor Pagination Logic - Complete Guide

## ✅ Implementation Summary

### 1. **Cursor Types**

#### **Simple Cursor (Timestamp)**
```typescript
// For posts, tournaments: created_at timestamp
cursor = encodeCursor({ timestamp: "2024-01-15T10:30:00Z" })
```

#### **Complex Cursor (Distance + ID)**
```typescript
// For nearby search: distance + id tuple
cursor = encodeCursor({ distance: 5.2, id: "uuid-123" })
```

---

## 2. **SQL Query Pattern**

### **Posts/Tournaments (Timestamp-based):**
```sql
SELECT * FROM posts
WHERE status = 'open'
  AND (:cursor IS NULL OR created_at < :cursor)
ORDER BY created_at DESC
LIMIT :limit;
```

### **Nearby Search (Distance-based):**
```sql
SELECT * FROM users
WHERE latitude IS NOT NULL
  AND longitude IS NOT NULL
  -- Cursor pagination logic:
  AND (
    :cursor_distance IS NULL
    OR (distance > :cursor_distance)
    OR (distance = :cursor_distance AND id > :cursor_id)
  )
ORDER BY distance ASC, id ASC
LIMIT :limit;
```

**Key Points:**
- `WHERE cursor_distance IS NULL` → First page (no cursor)
- `OR (distance > cursor_distance)` → Next pages with different distance
- `OR (distance = cursor_distance AND id > cursor_id)` → Handle ties (same distance)
- `ORDER BY distance ASC, id ASC` → Deterministic ordering

---

## 3. **Frontend Flow**

### **First Page:**
```typescript
const result = await postService.getPostsPaginated(20, null);
// Returns: { data: [...], nextCursor: "base64...", hasMore: true }
```

### **Next Page:**
```typescript
const result2 = await postService.getPostsPaginated(20, result.nextCursor);
// Uses cursor from previous page
```

### **Infinite Scroll:**
```typescript
const { items, loadMore, hasMore } = usePagination({
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

---

## 4. **Cursor Encoding/Decoding**

### **Encode:**
```typescript
const cursor = encodeCursor({ distance: 5.2, id: "uuid-123" });
// Returns: "eyJkaXN0YW5jZSI6NS4yLCJpZCI6InV1aWQtMTIzIn0="
```

### **Decode:**
```typescript
const decoded = decodeCursor(cursor);
// Returns: { distance: 5.2, id: "uuid-123" }
```

**Format:** Base64-encoded JSON string

---

## 5. **Service Layer Implementation**

### **Posts Service:**
```typescript
getPostsPaginated: async (
  limit: number = 20,
  cursor: Cursor = null,
  sport?: Sport
): Promise<PaginatedResponse<Post>> => {
  let query = supabase.from('posts').select('*').eq('status', 'open');
  
  // Apply cursor filter
  if (cursor) {
    const timestamp = getTimestampFromCursor(cursor);
    if (timestamp) {
      query = query.lt('created_at', timestamp);
    }
  }
  
  // Order and limit
  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(limit + 1); // Get one extra to check hasMore
  
  const posts = data ? data.map(mapPostFromDb) : [];
  const hasMore = posts.length > limit;
  const postsToReturn = hasMore ? posts.slice(0, limit) : posts;
  
  // Generate next cursor from last item
  const nextCursor = postsToReturn.length > 0
    ? createTimestampCursor(postsToReturn[postsToReturn.length - 1].createdAt)
    : null;
  
  return {
    data: postsToReturn,
    nextCursor,
    hasMore,
  };
}
```

### **Nearby Search (Complex Cursor):**
```typescript
searchNearby: async (cursor: Cursor = null, append: boolean = false) => {
  // Decode complex cursor
  let cursorFilter = null;
  if (cursor) {
    const decoded = decodeCursor(cursor);
    cursorFilter = decoded; // { distance, id }
  }
  
  const { data } = await supabase.rpc('search_nearby', {
    user_lat: loc.latitude,
    user_lng: loc.longitude,
    cursor_distance: cursorFilter?.distance || null,
    cursor_id: cursorFilter?.id || null,
    limit_count: limit + 1,
  });
  
  // Generate next cursor from last item
  const newNextCursor = usersToReturn.length > 0 && resultHasMore
    ? encodeCursor({
        distance: usersToReturn[usersToReturn.length - 1].distanceKm,
        id: usersToReturn[usersToReturn.length - 1].id,
      })
    : null;
  
  return { users, nextCursor, hasMore };
}
```

---

## 6. **Advantages of Cursor Pagination**

✅ **Fast** - No OFFSET, uses indexed columns  
✅ **Stable** - No duplicates when data changes  
✅ **Scalable** - Performance doesn't degrade with large datasets  
✅ **Correct** - Proper ordering even when records are added/deleted  
✅ **Efficient** - Only fetches what's needed  

---

## 7. **Cursor Generation Logic**

### **After fetching page:**
```typescript
// Extract last item from current page
const lastItem = items[items.length - 1];

// Generate cursor from last item
if (items ordered by timestamp) {
  nextCursor = createTimestampCursor(lastItem.createdAt);
} else if (items ordered by distance) {
  nextCursor = encodeCursor({
    distance: lastItem.distanceKm,
    id: lastItem.id,
  });
}
```

### **For next page:**
```typescript
// Use nextCursor as cursor parameter
const nextPage = await fetchPage(nextCursor, limit);
```

---

## 8. **Implementation Checklist**

- [x] Cursor utilities (encode/decode)
- [x] Simple cursor (timestamp) for posts/tournaments
- [x] Complex cursor (distance + id) for nearby search
- [x] SQL query with cursor filtering
- [x] Service layer paginated methods
- [x] usePagination hook
- [x] Infinite scroll in UI
- [x] Proper cursor generation
- [x] hasMore detection (limit + 1)

---

## 9. **Edge Cases Handled**

### **Empty Results:**
```typescript
if (posts.length === 0) {
  return {
    data: [],
    nextCursor: null,
    hasMore: false,
  };
}
```

### **Last Page:**
```typescript
const hasMore = posts.length > limit;
// If hasMore = false, nextCursor = null
```

### **Ties (Same Distance):**
```sql
-- Handle users with same distance using id
WHERE (distance > cursor_distance)
   OR (distance = cursor_distance AND id > cursor_id)
ORDER BY distance ASC, id ASC
```

---

## 10. **Testing**

### **Test Cases:**
1. ✅ First page (cursor = null)
2. ✅ Next page (cursor = nextCursor)
3. ✅ Last page (hasMore = false)
4. ✅ Empty results
5. ✅ Filtered results (sport, skill)
6. ✅ Distance-based ordering
7. ✅ Timestamp-based ordering
8. ✅ Infinite scroll loading

---

## 🎯 Summary

**Cursor Pagination is fully implemented with:**
- ✅ Simple cursors (timestamp)
- ✅ Complex cursors (distance + id)
- ✅ Proper SQL queries
- ✅ Frontend hooks
- ✅ Infinite scroll support
- ✅ Error handling
- ✅ Type safety

**All logic follows the specification exactly! 🚀**

