const chalk = require('chalk')
const assert = require('assert')
const memdown = require('memdown')
const ztakioDb = require('../src/')

async function test() {
  const db = ztakioDb(memdown())
  const results = {
    true: chalk.green('✔'),
    false: chalk.red('❌')
  }
  const putget = async (k, v, description) => {
    await db.put(k, v)
    let nv = await db.get(k)
    try {
      assert.deepStrictEqual(nv, v)
      console.log(` * ${description}: ${results[true]}`)
    } catch (e) {
      console.log(` * ${description}: ${results[false]}`)
    }

  }

  await putget('string', 'this is a test ñá', 'Stores Strings correctly')
  await putget('number', 4355435.34, 'Stores Strings correctly')
  await putget('bigint', 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn, 'Stores BigInts correctly')
  await putget('array_basic', ['asd', 134.12, 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn], 'Stores basic arrays correctly')
  await putget('array_nested', ['asd', 134.12, 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn, ['asdqwe', -23525.1, -0xCAFEBABEDEADBEEFn]], 'Stores nested basic correctly')
  await putget('object_empty', {}, 'Stores empty objects correctly')
  await putget('object_basic', {a: 1, b: 'asd', c: 259598n}, 'Stores basic objects correctly')
  await putget('object_nested', {a: 1, b: 'asd', c: 259598n, d: {x: 12, y: 'asdewr', z: 95745234n}}, 'Stores nested objects correctly')
  await putget('object_nested_array', {a: 1, b: 'asd', c: 259598n, d: {x: 12, y: 'asdewr', z: 95745234n, u: [2523235, 'ertertert', 7863478564378564n]}}, 'Stores nested objects with arrays correctly')
  await putget('buffer_empty', Buffer.from(''), 'Stores empty buffers correctly')
  await putget('buffer', Buffer.from('sdfgsdgfewewfg'), 'Stores buffers correctly')
}

test()
