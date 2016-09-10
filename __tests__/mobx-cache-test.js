import { autorun } from 'mobx'
import MobxCache from '../src/mobx-cache'

test('onMiss isn\'t called more than once', () => {
  const onMiss = jest.fn((x) => x + x)
  const cache = new MobxCache(onMiss)

  // The first `get` triggers `onMiss`.
  expect(cache.get('xyz')).toEqual({ status: 'success', value: 'xyzxyz' })
  expect(onMiss).toBeCalledWith('xyz')

  // Any subsequent `gets` don't trigger `onMiss`.
  onMiss.mockClear()
  expect(cache.get('xyz')).toEqual({ status: 'success', value: 'xyzxyz' })
  expect(onMiss).not.toBeCalled()
})

test('onMiss with async promise isn\'t called more than once', () => {
  const onMiss = jest.fn((x) =>
    new Promise(resolve => {
      setTimeout(() => resolve(x + x))
    })
  )
  const cache = new MobxCache(onMiss)

  // The first `get` triggers `onMiss`.
  expect(cache.get('xyz')).toEqual({ status: 'pending', value: undefined })
  expect(onMiss).toBeCalledWith('xyz')

  // Getting the same key again doesn't trigger `onMiss`.
  onMiss.mockClear()
  expect(cache.get('xyz')).toEqual({ status: 'pending', value: undefined })
  expect(onMiss).not.toBeCalled()

  // All subsequent `gets` of the same key won't trigger `onMiss`.
  onMiss.mockClear()
  return new Promise((resolve) => {
    setTimeout(() => {
      expect(cache.get('xyz')).toEqual({ status: 'success', value: 'xyzxyz' })
      expect(onMiss).not.toBeCalled()
      resolve()
    }, 10)
  })
})

test('cache doesn\'t mix keys', () => {
  const onMiss = jest.fn((x) => x + x)
  const cache = new MobxCache(onMiss)

  expect(cache.get('x').value).toBe('xx')
  expect(cache.get('y').value).toBe('yy')
  expect(cache.get('x').value).toBe('xx')
  expect(cache.get('z').value).toBe('zz')
  expect(cache.get('y').value).toBe('yy')

  expect(onMiss.mock.calls.length).toBe(3)
  expect(onMiss).toBeCalledWith('x')
  expect(onMiss).toBeCalledWith('y')
  expect(onMiss).toBeCalledWith('z')
})

test('onMiss isn\'t called for pre-populated keys', () => {
  const onMiss = jest.fn((x) => x + x)
  const cache = new MobxCache(onMiss)
  cache.populate('a', 'apple')
  cache.populate('b', 'banana')

  // Getting keys that already exist in the cache doesn't trigger `onMiss`.
  expect(cache.get('a')).toEqual({ status: 'success', value: 'apple' })
  expect(cache.get('b')).toEqual({ status: 'success', value: 'banana' })
  expect(onMiss).not.toBeCalled()

  // Getting a key that doesn't exist will trigger `onMiss`.
  expect(cache.get('x')).toEqual({ status: 'success', value: 'xx' })
  expect(onMiss).toBeCalledWith('x')
})

test('peek never calls onMiss', () => {
  const onMiss = jest.fn((x) =>
    new Promise(resolve => {
      setTimeout(() => resolve(x + x))
    })
  )
  const cache = new MobxCache(onMiss)
  cache.populate('a', 'apple')

  // Peeking values doesn't trigger a call to `onMiss`.
  expect(cache.peek('a')).toEqual({ status: 'success', value: 'apple' })
  expect(cache.peek('x')).toEqual({ status: undefined, value: undefined })
  expect(onMiss).not.toBeCalled()

  // Using `cache.get()` will trigger `onMiss`.
  cache.get('x')
  expect(onMiss).toBeCalledWith('x')

  // Now peeking 'x' should return the new status without calling `onMiss`.
  onMiss.mockClear()
  expect(cache.peek('x')).toEqual({ status: 'pending', value: undefined })
  expect(onMiss.mock.calls.length).toBe(0)
})

test('peek can observe all transitions of status and value', () => {
  function onMiss() {
    return new Promise(resolve => {
      setTimeout(() => resolve('VALUE'))
    })
  }
  const cache = new MobxCache(onMiss)
  const spy = jest.fn()

  // The initial call to `peek` should result in nothing.
  autorun(() => spy(cache.peek('a')))
  expect(spy).toBeCalledWith({ status: undefined, value: undefined })

  // When someone tries to `get` it, the `peek` observer will be triggered.
  spy.mockClear()
  cache.get('a')
  expect(spy).toBeCalledWith({ status: 'pending', value: undefined })

  // Once the value is resolved, the `peek` observer is triggered again.
  spy.mockClear()
  return new Promise((resolve) => {
    setTimeout(() => {
      expect(spy).toBeCalledWith({ status: 'success', value: 'VALUE' })
      resolve()
    }, 10)
  })
})

test('cache uses the `processData` option', () => {
  const onMiss = jest.fn((x) => x + x)
  const processData = jest.fn((xx) => xx + xx)
  const cache = new MobxCache(onMiss, { processData })

  expect(cache.get('x').value).toBe('xxxx')
  expect(cache.get('x').value).toBe('xxxx')
  expect(onMiss.mock.calls.length).toBe(1)
  expect(processData.mock.calls.length).toBe(1)
})

test('omitting the onMiss function should work', () => {
  const cache = new MobxCache()
  expect(cache.get('xyz')).toEqual({ status: undefined, value: undefined })

  return new Promise((resolve) => {
    setTimeout(() => {
      expect(cache.get('xyz')).toEqual({ status: undefined, value: undefined })
      resolve()
    }, 100)
  })
})

test('re-populating the cache should trigger observers', () => {
  const cache = new MobxCache()

  var expected = 'apple'
  cache.populate('a', expected)

  const valueExpectation = jest.fn((value) => expect(value).toEqual(expected))
  autorun(() => valueExpectation(cache.get('a').value))

  // The above autorun should call `valueExpectation` with the current cache value 'apple'.
  expect(valueExpectation.mock.calls.length).toBe(1)
  expect(valueExpectation).toBeCalledWith('apple')

  // Re-populating the same key should trigger the autorun observer.
  valueExpectation.mockClear()
  expected = 'lemon'
  cache.populate('a', expected)
  expect(valueExpectation.mock.calls.length).toBe(1)
  expect(valueExpectation).toBeCalledWith('lemon')

  // Populating a different key shouldn't trigger the observer.
  valueExpectation.mockClear()
  cache.populate('b', 'banana')
  expect(valueExpectation.mock.calls.length).toBe(0)
  expect(valueExpectation).not.toBeCalledWith('banana')
})
