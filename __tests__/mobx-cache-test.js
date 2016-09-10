import { when } from 'mobx'
import MobxCache from '../src/mobx-cache'

test('onMiss can return a value directly', () => {
  const cache = new MobxCache((x) => x + x)
  expect(cache.get('xyz')).toBe('xyzxyz')
})

test('onMiss can return a promise', () => {
  const cache = new MobxCache((x) => Promise.resolve(x + x))
  expect(cache.get('xyz')).toBeUndefined()

  return new Promise((resolve) => {
    when(
      () => cache.get('xyz'),
      () => {
        expect(cache.get('xyz')).toBe('xyzxyz')
        resolve()
      }
    )
  })
})

test('cache is observable and populated on the fly', () => {
  const onMiss = jest.fn((x) => Promise.resolve(x + x))
  const cache = new MobxCache(onMiss)

  expect(cache.get('xyz')).toBeUndefined()
  expect(onMiss.mock.calls[0][0]).toBe('xyz')

  return new Promise((resolve) => {
    when(
      () => cache.get('xyz'),
      () => {
        expect(cache.get('xyz')).toBe('xyzxyz')
        resolve()
      }
    )
  })
})

test('onMiss isn\'t called more than once', () => {
  const onMiss = jest.fn((x) => x + x)
  const cache = new MobxCache(onMiss)

  expect(cache.get('xyz')).toBe('xyzxyz')
  expect(onMiss.mock.calls.length).toBe(1)

  expect(cache.get('xyz')).toBe('xyzxyz')
  expect(onMiss.mock.calls.length).toBe(1)
})

test('onMiss with async promise isn\'t called more than once', () => {
  const onMiss = jest.fn((x) =>
    new Promise(resolve => {
      setTimeout(() => resolve(x + x))
    })
  )
  const cache = new MobxCache(onMiss)

  expect(cache.get('xyz')).toBeUndefined()
  expect(onMiss.mock.calls.length).toBe(1)

  expect(cache.get('xyz')).toBeUndefined()
  expect(onMiss.mock.calls.length).toBe(1)

  return new Promise((resolve) => {
    when(
      () => cache.get('xyz'),
      () => {
        cache.get('xyz')
        expect(onMiss.mock.calls.length).toBe(1)
        resolve()
      }
    )
  })
})

test('cache doesn\'t mix keys', () => {
  const onMiss = jest.fn((x) => x + x)
  const cache = new MobxCache(onMiss)

  expect(cache.get('x')).toBe('xx')
  expect(cache.get('y')).toBe('yy')
  expect(cache.get('x')).toBe('xx')
  expect(cache.get('z')).toBe('zz')
  expect(cache.get('y')).toBe('yy')

  expect(onMiss.mock.calls.length).toBe(3)
})

test('onMiss isn\'t called for pre-populated keys', () => {
  const onMiss = jest.fn((x) => x + x)
  const cache = new MobxCache(onMiss)
  cache.populate('a', 'apple')
  cache.populate('b', 'banana')

  expect(cache.get('a')).toBe('apple')
  expect(cache.get('b')).toBe('banana')
  expect(onMiss.mock.calls.length).toBe(0)

  expect(cache.get('x')).toBe('xx')
  expect(onMiss.mock.calls.length).toBe(1)
  expect(onMiss).toBeCalledWith('x')
})

test('peek never calls onMiss', () => {
  const onMiss = jest.fn((x) => x + x)
  const cache = new MobxCache(onMiss)
  cache.populate('a', 'apple')

  expect(cache.peek('a')).toBe('apple')
  expect(cache.peek('x')).toBeUndefined()
  expect(onMiss.mock.calls.length).toBe(0)
})

test('cache uses the `processData` option', () => {
  const onMiss = jest.fn((x) => x + x)
  const processData = jest.fn((xx) => xx + xx)
  const cache = new MobxCache(onMiss, { processData })

  expect(cache.get('x')).toBe('xxxx')
  expect(cache.get('x')).toBe('xxxx')
  expect(onMiss.mock.calls.length).toBe(1)
  expect(processData.mock.calls.length).toBe(1)
})

test('omitting the onMiss function should work', () => {
  const cache = new MobxCache()
  expect(cache.get('xyz')).toBeUndefined()

  return new Promise((resolve) => {
    setTimeout(() => {
      expect(cache.get('xyz')).toBeUndefined()
      resolve()
    }, 100)
  })
})
