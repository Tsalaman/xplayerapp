import { authService, userService, postService } from '../api';
import { supabase } from '../../__tests__/mocks/supabase';

// Mock the supabase import
jest.mock('../supabase', () => ({
  supabase: require('../../__tests__/mocks/supabase').supabase,
}));

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('calls supabase.auth.signUp with email and password', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      await authService.signup(email, password);

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email,
        password,
        options: {
          emailRedirectTo: undefined,
        },
      });
    });

    it('throws error when signup fails', async () => {
      const error = new Error('Email already registered');
      (supabase.auth.signUp as jest.Mock).mockResolvedValueOnce({
        data: null,
        error,
      });

      await expect(authService.signup('test@example.com', 'password')).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('calls supabase.auth.signInWithPassword with email and password', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      await authService.login(email, password);

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email,
        password,
      });
    });

    it('throws error when login fails', async () => {
      const error = new Error('Invalid credentials');
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
        data: null,
        error,
      });

      await expect(authService.login('test@example.com', 'wrong')).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('calls supabase.auth.signOut', async () => {
      await authService.logout();
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    it('calls supabase.auth.getUser', async () => {
      await authService.getCurrentUser();
      expect(supabase.auth.getUser).toHaveBeenCalled();
    });
  });
});

describe('userService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUser', () => {
    it('calls supabase.from with users table', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: null });

      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      await userService.getUser('user-id');

      expect(supabase.from).toHaveBeenCalledWith('users');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('id', 'user-id');
      expect(mockSingle).toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    it('updates user profile when profile exists', async () => {
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: {
          id: 'user-id',
          email: 'test@example.com',
          nickname: 'TestUser',
        },
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'user-id', email: 'test@example.com' },
          error: null,
        }),
      });

      (supabase.from as jest.Mock).mockReturnValueOnce({
        update: mockUpdate,
        eq: mockEq,
        select: mockSelect,
        single: mockSingle,
      });

      await userService.updateUser('user-id', { nickname: 'NewName' });

      expect(mockUpdate).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', 'user-id');
    });
  });
});

describe('postService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPosts', () => {
    it('calls supabase.from with posts table', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });

      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      });

      await postService.getPosts();

      expect(supabase.from).toHaveBeenCalledWith('posts');
      expect(mockEq).toHaveBeenCalledWith('status', 'open');
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
    });
  });

  describe('createPost', () => {
    it('calls supabase.from with posts table and inserts data', async () => {
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: {
          id: 'post-id',
          user_id: 'user-id',
          title: 'Test Post',
        },
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValueOnce({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      });

      await postService.createPost({
        userId: 'user-id',
        userNickname: 'TestUser',
        type: 'teammate',
        sport: 'football',
        title: 'Test Post',
        description: 'Test description',
        status: 'open',
      });

      expect(supabase.from).toHaveBeenCalledWith('posts');
      expect(mockInsert).toHaveBeenCalled();
      expect(mockSelect).toHaveBeenCalled();
      expect(mockSingle).toHaveBeenCalled();
    });
  });
});

