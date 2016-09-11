# MobxCache
_An observable data cache with [MobX](https://mobxjs.github.io/mobx/)._

[![Build Status](https://travis-ci.org/mdebbar/mobx-cache.svg?branch=master)](https://travis-ci.org/mdebbar/mobx-cache)
[![Coverage Status](https://coveralls.io/repos/github/mdebbar/mobx-cache/badge.svg?branch=master)](https://coveralls.io/github/mdebbar/mobx-cache?branch=master)
[![Downloads](https://img.shields.io/npm/dt/mobx-cache.svg)](https://www.npmjs.com/package/mobx-cache)


## Installation

If using npm to manage your dependencies, you can easily do:
```
npm install --save mobx-cache
```
Also, make sure `mobx` is installed since this library relies on it.

## Example 1: Simple hello world

```javascript
import React from "react"
import MobxCache from "mobx-cache"
import { observer } from "mobx-react"

var helloMessages = new MobxCache((name) => `Hello, ${name}`)

const HelloWorldApp = observer(function HelloWorldApp(props) {
  return (
    <div>
      <h1>{helloMessages.get(props.name).value}</h1>
    </div>
  )
})

React.render(<HelloWorldApp name="John Doe" />, document.body)

// The next line will update the cache and cause `HelloWorldApp` to re-render
// with the new message:
helloMessages.populate('John Doe', 'Hello again, John!')
```

The above example is for demonstration purposes only. It may not be useful in real life. This library is especially useful when used for data fetching as the next example shows.

## Example 2: User profile

```javascript
import React from "react"
import MobxCache from "mobx-cache"
import { observer } from "mobx-react"

var usersCache = new MobxCache((id) => fetch(`/users/${id}`))

const UserProfile = observer(function HelloWorldApp(props) {
  const entry = usersCache.get(props.id)
  if (entry.status !== 'success') {
    return <div>Loading...</div>
  }

  const user = entry.value
  return (
    <div>
      <img src={user.image} />
      <h1>{user.name}</h1>
      <p>{user.bio}</p>
    </div>
  )
})

// Rendering with the id 199 will cause the fetching of user 199.
React.render(<UserProfile id={199} />, document.body)

// When we render with a different id, the new user will be fetched and rendered.
React.render(<UserProfile id={299} />, document.body)
```
The `fetch` function can be any function that sends a request to the given url and returns a promise. The promise will automatically be handlded by MobxCache.
