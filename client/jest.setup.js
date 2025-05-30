// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    }
  },
  usePathname() {
    return ''
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies() {
    return {
      get: jest.fn(() => ({ value: 'test-token' })), // Always return a fake token
      set: jest.fn(),
      delete: jest.fn(),
    }
  },
}))

// Simple mock for Headers, Request, Response
class MockHeaders {
  constructor(init) {
    this.map = new Map()
    if (init) {
      Object.entries(init).forEach(([k, v]) => this.map.set(k.toLowerCase(), v))
    }
  }
  get(name) { return this.map.get(name.toLowerCase()) }
  set(name, value) { this.map.set(name.toLowerCase(), value) }
  has(name) { return this.map.has(name.toLowerCase()) }
  delete(name) { this.map.delete(name.toLowerCase()) }
  append(name, value) { this.map.set(name.toLowerCase(), value) }
  entries() { return this.map.entries() }
  keys() { return this.map.keys() }
  values() { return this.map.values() }
  forEach(cb) { this.map.forEach((v, k) => cb(v, k, this)) }
}

class MockRequest {
  constructor(input, init) {
    this.url = input
    this.method = init?.method || 'GET'
    this.headers = new MockHeaders(init?.headers)
    this.body = init?.body
    this.nextUrl = { pathname: new URL(input).pathname, searchParams: new URL(input).searchParams }
    this.cookies = { get: jest.fn(() => ({ value: 'test-token' })) }
  }
  json() { return Promise.resolve(this.body ? JSON.parse(this.body) : {}) }
}

class MockResponse {
  constructor(body, init) {
    this._body = body
    this.status = init?.status || 200
    this.headers = new MockHeaders(init?.headers)
  }
  json() { return Promise.resolve(typeof this._body === 'string' ? JSON.parse(this._body) : this._body) }
  text() { return Promise.resolve(this._body) }
  static json(body, init) {
    return new MockResponse(JSON.stringify(body), { ...init, headers: { 'Content-Type': 'application/json', ...(init && init.headers) } })
  }
}

global.Headers = MockHeaders
global.Request = MockRequest
global.Response = MockResponse

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const fetchMock = jest.fn((url, options) => {
  // Log the URL and options for debugging
  console.log('fetchMock called with:', url, options);

  // Normalize URL for matching
  const urlObj = new URL(url, API_URL);
  const path = urlObj.pathname;
  const fullUrl = urlObj.origin + urlObj.pathname;

  // Helper to match both backend and frontend API URLs
  function matchNotesEndpoint(endpoint) {
    return (
      path === endpoint ||
      fullUrl === `${API_URL}${endpoint}` ||
      url === `${API_URL}${endpoint}` ||
      url === endpoint
    );
  }

  // Helper to match /api/notes/:id for both backend and frontend URLs
  function matchNotesIdEndpoint() {
    const notesIdRegex = /^\/api\/notes\/\w+$/;
    return notesIdRegex.test(path) ||
      notesIdRegex.test(urlObj.pathname) ||
      notesIdRegex.test(url.replace(`${API_URL}`, ''));
  }

  // GET all notes
  if (options?.method === 'GET' && matchNotesEndpoint('/api/notes')) {
    return Promise.resolve(new MockResponse(JSON.stringify([
      { id: 'mock-id', title: 'Test Note', content: 'Test Content' }
    ]), { status: 200, headers: { 'Content-Type': 'application/json' } }))
  }

  // POST new note
  if (options?.method === 'POST' && matchNotesEndpoint('/api/notes')) {
    const body = JSON.parse(options.body)
    if (!body.title || !body.content) {
      return Promise.resolve(new MockResponse(JSON.stringify({ message: 'Invalid request body' }), { status: 400 }))
    }
    return Promise.resolve(new MockResponse(JSON.stringify({ 
      id: 'mock-id', 
      title: body.title, 
      content: body.content 
    }), { status: 201, headers: { 'Content-Type': 'application/json' } }))
  }

  // GET single note
  if (options?.method === 'GET' && matchNotesIdEndpoint()) {
    const id = path.split('/').pop()
    if (id === 'nonexistent') {
      return Promise.resolve(new MockResponse(JSON.stringify({ message: 'Not found' }), { status: 404 }))
    }
    return Promise.resolve(new MockResponse(JSON.stringify({ 
      id, 
      title: 'Test Note', 
      content: 'Test Content' 
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
  }

  // PUT update note
  if (options?.method === 'PUT' && matchNotesIdEndpoint()) {
    const id = path.split('/').pop()
    if (id === 'nonexistent') {
      return Promise.resolve(new MockResponse(JSON.stringify({ message: 'Not found' }), { status: 404 }))
    }
    const body = JSON.parse(options.body)
    return Promise.resolve(new MockResponse(JSON.stringify({ 
      id, 
      title: body.title, 
      content: body.content 
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
  }

  // DELETE note
  if (options?.method === 'DELETE' && matchNotesIdEndpoint()) {
    const id = path.split('/').pop()
    if (id === 'nonexistent') {
      return Promise.resolve(new MockResponse(JSON.stringify({ message: 'Not found' }), { status: 404 }))
    }
    // 204 should return an empty string
    return Promise.resolve(new MockResponse('', { status: 204 }))
  }

  // Default fallback
  return Promise.resolve(new MockResponse(JSON.stringify({ message: 'Not found' }), { status: 404 }))
})

global.fetch = fetchMock

// Mock NextResponse
jest.mock('next/server', () => {
  const actual = jest.requireActual('next/server')
  return {
    ...actual,
    NextResponse: {
      redirect: (url) => {
        const response = new MockResponse(null, { status: 307 })
        response.headers.set('location', url)
        return response
      },
      next: () => new MockResponse(null, { status: 200 }),
      json: (body, init) => new MockResponse(body, init),
    },
  }
}) 