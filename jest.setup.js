import '@testing-library/jest-dom'
import { loadEnvConfig } from '@next/env'

// Load environment variables for testing
loadEnvConfig(process.cwd())

// Set up test environment variables
process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

// Mock ResizeObserver for JSDOM
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock Web APIs for Node.js test environment
global.URL = class {
  constructor(url, base) {
    this.href = base ? `${base}${url}` : url;
    this.searchParams = new URLSearchParams(url.split('?')[1] || '');
  }
};

global.Request = class {
  constructor(url, options = {}) {
    this.url = url;
    this.method = options.method || 'GET';
    this.headers = new Map(Object.entries(options.headers || {}));
    this.body = options.body;
    this.nextUrl = { searchParams: new URLSearchParams() };
  }
  
  async json() {
    return JSON.parse(this.body || '{}');
  }
};

global.Response = class {
  constructor(body, options = {}) {
    this.body = body;
    this.status = options.status || 200;
    this.ok = this.status >= 200 && this.status < 300;
    this.headers = new Map(Object.entries(options.headers || {}));
  }
  
  async json() {
    return JSON.parse(this.body || '{}');
  }
  
  async text() {
    return this.body || '';
  }
};

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  })
);

// Mock Next.js server utilities
jest.mock('next/server', () => ({
  NextRequest: global.Request,
  NextResponse: {
    json: (data, options = {}) => new global.Response(JSON.stringify(data), {
      status: options.status || 200,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    }),
    redirect: jest.fn(),
  },
}));

// Mock Clerk auth server function
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(() => Promise.resolve({ userId: 'test-user-id' })),
}));

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            data: [],
            error: null,
          })),
          single: jest.fn(() => ({
            data: null,
            error: null,
          })),
          data: [],
          error: null,
        })),
        data: [],
        error: null,
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: null,
            error: null,
          })),
          data: [],
          error: null,
        })),
        data: [],
        error: null,
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: null,
              error: null,
            })),
            data: [],
            error: null,
          })),
          data: [],
          error: null,
        })),
        data: [],
        error: null,
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: [],
          error: null,
        })),
        data: [],
        error: null,
      })),
    })),
    auth: {
      getUser: jest.fn(() => Promise.resolve({ user: null, error: null })),
    },
  })),
}));

// Mock Clerk for testing
jest.mock('@clerk/nextjs', () => ({
  auth: jest.fn(),
  ClerkProvider: ({ children }) => children,
  SignInButton: ({ children }) => <button>{children || 'Sign In'}</button>,
  SignUpButton: ({ children }) => <button>{children || 'Sign Up'}</button>,
  UserButton: () => <button>User Menu</button>,
  SignIn: () => <div data-testid="clerk-sign-in">Sign In Component</div>,
  SignUp: () => <div data-testid="clerk-sign-up">Sign Up Component</div>,
  useUser: jest.fn(() => ({
    user: null,
    isLoaded: true,
    isSignedIn: false,
  })),
  useAuth: jest.fn(() => ({
    isLoaded: true,
    isSignedIn: false,
    signOut: jest.fn(),
  })),
  currentUser: jest.fn(() => null),
  redirectToSignIn: jest.fn(),
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  redirect: jest.fn(),
}))

// Mock SWR
jest.mock('swr', () => {
  const mockUseSWR = jest.fn(() => ({
    data: null,
    error: null,
    isLoading: false,
    mutate: jest.fn(),
  }));
  
  return {
    __esModule: true,
    default: mockUseSWR,
  };
})

// Mobile viewport testing helper
global.resizeWindow = (width, height) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  })
  window.dispatchEvent(new Event('resize'))
}