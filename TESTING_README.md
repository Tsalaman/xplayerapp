# Testing Guide - XPlayer Mobile App

## Setup

### Install Dependencies
```bash
npm install
```

All testing dependencies are already included in `package.json`:
- `jest` - Testing framework
- `jest-expo` - Expo-specific Jest configuration
- `@testing-library/react-native` - Component testing
- `@testing-library/react-hooks` - Hook testing
- `@testing-library/jest-native` - Additional matchers

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run tests in CI mode
```bash
npm run test:ci
```

## Test Structure

```
__tests__/
  ├── setup.ts              # Test setup and global mocks
  ├── mocks/
  │   ├── supabase.ts       # Supabase client mock
  │   ├── expo-router.ts    # Expo Router mock
  │   └── asyncStorage.ts   # AsyncStorage mock

components/
  └── ui/
      └── __tests__/
          ├── Button.test.tsx
          ├── Card.test.tsx
          └── Input.test.tsx

hooks/
  └── __tests__/
      └── useDebounce.test.ts

services/
  └── __tests__/
      └── api.test.ts

utils/
  └── __tests__/
      └── cache.test.ts
```

## What's Tested

### ✅ Components (3 tests)
- **Button** - Rendering, variants, sizes, disabled/loading states, onPress
- **Card** - Rendering, variants, padding sizes
- **Input** - Rendering, label, error states, onChangeText, icons, disabled

### ✅ Hooks (1 test)
- **useDebounce** - Debounce delay, value changes, timeout cancellation

### ✅ Services (1 test)
- **authService** - Signup, login, logout, getCurrentUser
- **userService** - Get/update user
- **postService** - Get/create posts

### ✅ Utilities (1 test)
- **cache** - Get/set/delete, TTL expiration, cleanup

## Coverage Goals

- **Global Coverage**: 70% minimum
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## Writing New Tests

### Component Test Example
```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Button from '../Button';

describe('Button', () => {
  it('renders correctly', () => {
    const { getByText } = render(<Button title="Test" onPress={() => {}} />);
    expect(getByText('Test')).toBeTruthy();
  });
});
```

### Hook Test Example
```typescript
import { renderHook, waitFor } from '@testing-library/react-hooks';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  it('debounces value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'test' } }
    );
    // ... test implementation
  });
});
```

### Service Test Example
```typescript
import { authService } from '../api';
import { supabase } from '../../__tests__/mocks/supabase';

describe('authService', () => {
  it('calls supabase.auth.signUp', async () => {
    await authService.signup('test@example.com', 'password');
    expect(supabase.auth.signUp).toHaveBeenCalled();
  });
});
```

## Mocking

### Expo Modules
All Expo modules are mocked in `__tests__/setup.ts`:
- `expo-location`
- `expo-router`
- `@expo/vector-icons`
- `@react-native-async-storage/async-storage`

### Supabase
Supabase client is mocked in `__tests__/mocks/supabase.ts`:
- Auth methods (signUp, signInWithPassword, signOut)
- Database queries (from, select, insert, update, delete)
- Real-time subscriptions (channel, on, subscribe)

## Next Steps

### To Add More Tests:
1. **More Components**: Badge, Avatar, Dialog, Sheet
2. **More Hooks**: useThrottle, useNotifications, useLocation
3. **More Services**: matchesService, notificationsService
4. **Integration Tests**: Auth flow, Post creation flow

### To Run Tests:
1. Run `npm install` to install dependencies
2. Run `npm test` to verify setup
3. Add more tests as you develop features

## Troubleshooting

### "Cannot find module" errors
- Make sure all dependencies are installed: `npm install`
- Check `jest.config.js` for correct module paths

### "Timeout" errors
- Increase timeout in test: `jest.setTimeout(10000)`
- Check async operations are properly awaited

### Mock errors
- Verify mocks are imported correctly
- Check `__tests__/setup.ts` has all required mocks

