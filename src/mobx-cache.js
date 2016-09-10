import { action, asMap, observable } from 'mobx'

const identityFn = x => x

export default class MobxCache {
  _status = {};
  @observable _cache = asMap({});

  defaultOptions = {
    processData: identityFn,
  }

  /**
   * @onMiss: function that returns a promise resolving into the value to be inserted in the cache.
   * @options:
   * - processData: function to process data after it's received from onMiss().
   */
  constructor(onMiss, options) {
    this.onMiss = onMiss
    this.options = Object.assign({}, this.defaultOptions, options)
  }

  // Try to find the data in the cache. If it's not there, it will be fetched from the server.
  get(key) {
    this._maybeCacheMiss(key)
    return this.peek(key)
  }

  // Get whatever is in the cache. No server request.
  peek(key) {
    return this._cache.get(key)
  }

  _maybeCacheMiss(key) {
    if (!this._status[key] && typeof this.onMiss === 'function') {
      // Cache miss!
      const value = this.onMiss(key)
      if (typeof value.then === 'function') {
        this._status[key] = 'loading'
        value.then(data => this.populate(key, data))
      } else {
        this.populate(key, value)
      }
    }
  }

  @action populate(key, data) {
    const processData = this.options.processData || identityFn
    this._status[key] = 'success'
    this._cache.set(key, processData(data))
  }
}
