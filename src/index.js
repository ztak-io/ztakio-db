const levelup = require('levelup')

const dry = (value) => {
  if (Buffer.isBuffer(value)) {
    return { _t: 'buffer', _v: value.toString('base64') }
  } else if (typeof(value) === 'bigint') {
    return { _t: 'bigint', _v: '' + value }
  } else if (Array.isArray(value)) {
    return value.map(dry)
  } else if (typeof(value) === 'object') {
    return {_t: 'object', _v: Object.fromEntries(
      Object.entries(value).map(
        ([k,v]) => ([k, dry(v)])
      )
    )}
  } else {
    return value
  }
}

const wet = (value) => {
  if (Array.isArray(value)) {
    return value.map(wet)
  } else if (typeof(value) === 'object') {
    if (Object.entries(value).length === 2 && '_t' in value && '_v' in value) {
      if (value._t === 'buffer') {
        return Buffer.from(value._v, 'base64')
      } else if (value._t === 'bigint') {
        return BigInt(value._v)
      } else if (value._t === 'object') {
        return Object.fromEntries(
          Object.entries(value._v).map(
            ([k,v]) => ([k, wet(v)])
          )
        )
      } else {
        throw new Error(`Unknown wet type: ${value._t}`)
      }
    } else {
      throw new Error('Invalid value found in storage, raw objects not supported')
    }
  } else {
    return value
  }
}

const store = (connection) => {
  let db = levelup(connection)
  let transaction = null

  const get = async (key) => {
    if (!key) {
      return null
    }

    if (transaction !== null && key in transaction) {
      return transaction[key]
    } else {
      try {
        let value = await db.get(key)
        return wet(JSON.parse(value))
      } catch (e) {
        return null
      }
    }
  }

  const put = async (key, value) => {
    if (transaction !== null) {
      transaction[key] = value
    } else {
      await db.put(key, JSON.stringify(dry(value)))
    }
  }

  const start = async () => {
    transaction = {}
  }

  const commit = async () => {
    if (transaction !== null) {
      job = transaction
      transaction = null

      for (x in job) {
        await put(x, job[x])
      }
    }
  }

  const rollback = async () => {
    transaction = null
  }

  const iteratorPromisifier = (iter) => new Promise((resolve, reject) => {
    iter.on('data', (pair) => {
      resolve(pair)
    })
  })

  const iterator = async function* (options) {
    let iter = iteratorPromisifier(options)
    while (pair = (await iter)) {
      yield pair
    }
  }

  return {
    get, put, start, commit, rollback, iterator, _raw: () => {
      console.log('WARNING: Hope you know what you\'re doing, _raw shouldn\'t be used if you aren\'t developing ztak-db ')
      return db
    }
  }
}

module.exports = store
