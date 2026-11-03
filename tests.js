// Integration tests against a real, ephemeral MongoDB instance (mongodb-memory-server),
// not mocks. TOTAL_TESTS is incremented next to every assertion and checked at the end,
// so this file only reports success if every individual assertion actually ran and passed.
const assert = require('assert');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('./myApp');
const Person = require('./models/person');

const TOTAL_TESTS = 20;
let passed = 0;
const ok = (cond, msg) => {
  assert.ok(cond, msg);
  passed++;
};

const run = async () => {
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri(), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // 1-4: createAndSavePerson
  const saved = await new Promise((resolve, reject) =>
    app.createAndSavePerson((err, data) => (err ? reject(err) : resolve(data)))
  );
  ok(saved._id, 'createAndSavePerson: saved document has an _id');
  ok(saved.name === 'John Doe', 'createAndSavePerson: name is correct');
  ok(saved.age === 30, 'createAndSavePerson: age is correct');
  ok(
    Array.isArray(saved.favoriteFoods) && saved.favoriteFoods.includes('pizza'),
    'createAndSavePerson: favoriteFoods is correct'
  );

  // 5-6: createManyPeople
  const arrayOfPeople = [
    { name: 'Mary', age: 45, favoriteFoods: ['burritos'] },
    { name: 'Mary', age: 22, favoriteFoods: ['sushi'] },
    { name: 'Akira', age: 28, favoriteFoods: ['burritos', 'ramen'] },
    { name: 'Zara', age: 33, favoriteFoods: ['burritos'] },
  ];
  const created = await new Promise((resolve, reject) =>
    app.createManyPeople(arrayOfPeople, (err, data) => (err ? reject(err) : resolve(data)))
  );
  ok(created.length === 4, 'createManyPeople: created the expected number of documents');
  ok(
    created.every((p) => p._id),
    'createManyPeople: every created document has an _id'
  );

  // 7-8: findPeopleByName
  const marys = await new Promise((resolve, reject) =>
    app.findPeopleByName('Mary', (err, data) => (err ? reject(err) : resolve(data)))
  );
  ok(marys.length === 2, 'findPeopleByName: finds every document with that name');
  ok(
    marys.every((p) => p.name === 'Mary'),
    'findPeopleByName: every result actually has that name'
  );

  // 9: findOneByFood
  const ramenLover = await new Promise((resolve, reject) =>
    app.findOneByFood('ramen', (err, data) => (err ? reject(err) : resolve(data)))
  );
  ok(ramenLover.name === 'Akira', 'findOneByFood: finds the right single document');

  // 10: findPersonById
  const byId = await new Promise((resolve, reject) =>
    app.findPersonById(saved._id.toString(), (err, data) => (err ? reject(err) : resolve(data)))
  );
  ok(byId.name === 'John Doe', 'findPersonById: finds the right document by id');

  // 11-12: findEditThenSave
  const edited = await new Promise((resolve, reject) =>
    app.findEditThenSave(saved._id.toString(), (err, data) => (err ? reject(err) : resolve(data)))
  );
  ok(
    edited.favoriteFoods.includes('hamburger'),
    'findEditThenSave: hamburger was pushed to favoriteFoods'
  );
  ok(
    edited.favoriteFoods.includes('pizza'),
    'findEditThenSave: existing favoriteFoods are preserved'
  );

  // 13-14: findAndUpdate
  const akiraId = created.find((p) => p.name === 'Akira')._id.toString();
  await new Promise((resolve, reject) =>
    app.findAndUpdate('Akira', (err, data) => (err ? reject(err) : resolve(data)))
  ).then((updated) => {
    ok(updated.age === 20, 'findAndUpdate: age was updated to 20');
    ok(updated.name === 'Akira', 'findAndUpdate: returned the right person');
  });

  // 15-16: removeById
  const removed = await new Promise((resolve, reject) =>
    app.removeById(akiraId, (err, data) => (err ? reject(err) : resolve(data)))
  );
  ok(removed && removed._id.toString() === akiraId, 'removeById: returns the removed document');
  const afterRemove = await Person.findById(akiraId);
  ok(afterRemove === null, 'removeById: document is actually gone from the database');

  // 17-18: removeManyPeople
  const removeResult = await new Promise((resolve, reject) =>
    app.removeManyPeople((err, data) => (err ? reject(err) : resolve(data)))
  );
  ok(
    removeResult.deletedCount === 2,
    'removeManyPeople: reports the correct number of deleted documents'
  );
  const maryCountAfter = await Person.countDocuments({ name: 'Mary' });
  ok(maryCountAfter === 0, 'removeManyPeople: no "Mary" documents remain in the database');

  // 19-20: queryChain
  const chained = await new Promise((resolve, reject) =>
    app.queryChain((err, data) => (err ? reject(err) : resolve(data)))
  );
  ok(chained.length <= 2, 'queryChain: limit(2) is respected');
  ok(
    chained.every((p) => p.age === undefined),
    'queryChain: select hides the age field'
  );

  await mongoose.disconnect();
  await mongod.stop();

  assert.strictEqual(
    passed,
    TOTAL_TESTS,
    `Expected ${TOTAL_TESTS} passing assertions, got ${passed}`
  );
  console.log(`${passed}/${TOTAL_TESTS} tests passed.`);
};

run().catch((err) => {
  console.error('TEST SUITE FAILED:', err);
  process.exit(1);
});
