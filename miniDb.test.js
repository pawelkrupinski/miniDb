import MiniDb from './miniDb.js'
import localStorage from 'localStorage'

test('empty database returns no results', () => {
  const db = new MiniDb()

  expect(db.select().get()).toStrictEqual([])
})

test('empty database with a filter', () => {
  const db = new MiniDb()

  expect(db.select({ a: "1" }).get()).toStrictEqual([])
})

test('filtering', () => {
  const db = new MiniDb([{ a: 1 }, { a: 2 }])

  expect(db.select({ a: 1 }).get()).toStrictEqual([{ a: 1 }])
})

test('insert into empty', () => {
  const db = new MiniDb()

  db.insert({ a: 1 })

  expect(db.get()).toStrictEqual([{ a: 1 }])
})

test('insert into existing', () => {
  const db = new MiniDb([{b: 2}, {c: 5}])

  db.insert({ a: 1 })

  expect(db.get()).toStrictEqual([{b: 2}, {c: 5}, { a: 1 }])
})

test('insert many into empty', () => {
  const db = new MiniDb()

  db.insertMany([{ a: 1 }, { a: 2 }])

  expect(db.get()).toStrictEqual([{ a: 1 }, { a: 2 }])
})

test('insert many into existing', () => {
  const db = new MiniDb([{b: 2}, {c: 5}])

  db.insertMany([{ a: 1 }, { a: 2 }])

  expect(db.get()).toStrictEqual([{b: 2}, {c: 5}, { a: 1 }, { a: 2 }])
})

test('delete all', () => {
  const db = new MiniDb([{b: 2}, {c: 5}])

  db.delete()

  expect(db.get()).toStrictEqual([])
})

test('delete with filter', () => {
  const db = new MiniDb([{b: 2}, {c: 5}])

  db.select({c: 5}).delete()

  expect(db.get()).toStrictEqual([{b: 2}])
})

test('update all', () => {
  const db = new MiniDb([{b: 2}, {c: 5}])

  db.update({b: 1})

  expect(db.get()).toStrictEqual([{b: 1}, {b: 1, c: 5}])
})

test('update with filter', () => {
  const db = new MiniDb([{b: 2}, {c: 5}])

  db.select({b: 2}).update({b: 1})

  expect(db.get()).toStrictEqual([{b: 1}, {c: 5}])
})

test('limit', () => {
  const db = new MiniDb([{b: 2}, {c: 5}, { a: 1}])

  expect(db.limit(1).get()).toStrictEqual([{b: 2}])
  expect(db.limit(2).get()).toStrictEqual([{b: 2}, {c: 5}])
  expect(db.limit(3).get()).toStrictEqual([{b: 2}, {c: 5}, { a: 1}])
  expect(db.limit(4).get()).toStrictEqual([{b: 2}, {c: 5}, { a: 1}])
})

test('start', () => {
  const db = new MiniDb([{b: 2}, {c: 5}, { a: 1}])

  expect(db.start(1).get()).toStrictEqual([{b: 2}, {c: 5}, { a: 1}])
  expect(db.start(2).get()).toStrictEqual([{c: 5}, { a: 1}])
  expect(db.start(3).get()).toStrictEqual([{ a: 1}])
  expect(db.start(4).get()).toStrictEqual([])
})

test('combining', () => {
  const db = new MiniDb([{b: 2}, {c: 5}, { a: 1}, {d: 6}, { c:5, b: 1}])

  expect(db.start(1).limit(1).get()).toStrictEqual([{b: 2}])
  expect(db.start(2).limit(2).get()).toStrictEqual([{c: 5}, { a: 1}])
  expect(db.start(2).select({d: 6}).get()).toStrictEqual([{d: 6}])
  expect(db.start(2).select({c: 5}).get()).toStrictEqual([{c: 5}, { c:5, b: 1}])
  expect(db.limit(1).start(2).get()).toStrictEqual([])
})

test('combining and deleting', () => {
  {
    const db = new MiniDb([{b: 2}, {c: 5}, { a: 1}, {d: 6}, { c:5, b: 1}])
    
    expect(db.select({c: 5}).select({b: 1}).delete().get()).toStrictEqual([{b: 2}, {c: 5}, { a: 1}, {d: 6}])
  }
  {
    const db = new MiniDb([{b: 2}, {c: 5}, { a: 1}, {d: 6}, { c:5, b: 1}])
    
    expect(db.select({c: 5}).limit(1).delete().get()).toStrictEqual([{b: 2}, { a: 1}, {d: 6}, { c:5, b: 1}])
  }
  {
    const db = new MiniDb([{b: 2}, {c: 5}, {a: 1}, {d: 6}, { c:5, b: 1}])
    
    expect(db.limit(3).select({a: 1}).delete().get()).toStrictEqual([{b: 2}, {c: 5}, {d: 6}, { c:5, b: 1}])
  }
})

test('combining and updating', () => {
  const db = new MiniDb([{b: 2}, {c: 5}, { a: 1}, {d: 6}, { c:5, b: 1}])
  
  expect(db.limit(2).start(2).update({a: 1}).get()).toStrictEqual([{b: 2}, {c: 5, a: 1}, { a: 1}, {d: 6}, { c:5, b: 1}])
})

test('storing', () => {
  const db = new MiniDb([{b: 2}, {c: 5}])

  db.store("myStore")

  const db2 = new MiniDb().store("myStore")

  expect(db2.get()).toStrictEqual([{b: 2}, {c: 5}])
})

test('storing after update', () => {
  const db = new MiniDb([{b: 2}, {c: 5}])

  db.store("myStore").limit(1).update({a: 1})

  const db2 = new MiniDb().store("myStore")

  expect(db2.get()).toStrictEqual([{a: 1, b: 2}, {c: 5}])
})

test('storing after delete', () => {
  const db = new MiniDb([{b: 2}, {c: 5}])

  db.store("myStore").limit(1).delete()

  const db2 = new MiniDb().store("myStore")

  expect(db2.get()).toStrictEqual([{c: 5}])
})

