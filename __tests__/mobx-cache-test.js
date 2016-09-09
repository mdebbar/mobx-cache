import { when } from "mobx"
import MobxCache from "../src/mobx-cache"

test('cache is observable and populated on the fly', () => {
  const onMiss = jest.fn((x) => Promise.resolve(x + x))
  const cache = new MobxCache(onMiss)

  expect(cache.get("xyz")).toBeUndefined()
  expect(onMiss.mock.calls[0][0]).toBe("xyz")

  return new Promise((resolve) => {
    when(
      () => cache.get("xyz"),
      () => {
        expect(cache.get("xyz")).toBe("xyzxyz")
        resolve()
      }
    )
  })
})

test('cache only calls onMiss when necessary', () => {
  const onMiss = jest.fn((x) => Promise.resolve(x + x))
  const cache = new MobxCache(onMiss)

  cache.get("xyz")
  expect(onMiss.mock.calls.length).toBe(1)
  cache.get("xyz")
  expect(onMiss.mock.calls.length).toBe(1)

  return new Promise((resolve) => {
    when(
      () => cache.get("xyz"),
      () => {
        cache.get("xyz")
        expect(onMiss.mock.calls.length).toBe(1)
        resolve()
      }
    )
  })
})

test('cache doesn\'t mix keys', () => {
  const onMiss = jest.fn((x) => Promise.resolve(x + x))
  const cache = new MobxCache(onMiss)

  return new Promise((resolve) => {
    when(
      () => cache.get("x") && cache.get("y") && cache.get("z"),
      () => {
        expect(onMiss.mock.calls.length).toBe(3)
        expect(cache.get("x")).toBe("xx")
        expect(cache.get("y")).toBe("yy")
        expect(cache.get("z")).toBe("zz")
        resolve()
      }
    )
  })
})

test('cache peek doesn\'t call onMiss', () => {
  const onMiss = jest.fn((x) => Promise.resolve(x + x))
  const cache = new MobxCache(onMiss)

  cache.peek("x")
  expect(onMiss.mock.calls.length).toBe(0)
})

test('cache uses the `processData` option', () => {
  const onMiss = jest.fn((x) => Promise.resolve(x + x))
  const processData = (xx) => xx + xx
  const cache = new MobxCache(onMiss, { processData })

  return new Promise((resolve) => {
    when(
      () => cache.get("x"),
      () => {
        expect(cache.get("x")).toBe("xxxx")
        resolve()
      }
    )
  })
})

test('works if omitting the onMiss function', () => {
  const cache = new MobxCache()
  expect(cache.get('xyz')).toBeUndefined()

  return new Promise((resolve) => {
    setTimeout(() => {
      expect(cache.get('xyz')).toBeUndefined()
      resolve()
    }, 100)
  })
})
