export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  canGoBack: jest.fn(() => true),
};

export const mockUseRouter = () => mockRouter;
export const mockUsePathname = () => '/';
export const mockUseSegments = () => [];
export const mockUseLocalSearchParams = () => ({});

