import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
      isLocaleDomain: true,
      isReady: true,
      defaultLocale: 'en',
      domainLocales: [],
      isPreview: false,
    }
  },
}))




// Mock date-fns
jest.mock('date-fns', () => ({
  formatDistanceToNow: () => '2日後',
}))

jest.mock('date-fns/locale', () => ({
  ja: {},
}))

// Suppress console warnings for tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
       args[0].includes('An update to TestComponent inside a test was not wrapped in act') ||
       args[0].includes('When testing, code that causes React state updates should be wrapped into act'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})