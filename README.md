# Checkpoint — Mongoose & NodeJS VS MongoDB

GoMyCode checkpoint — *NoSQL Cloud Datastores: Mongoose & MongoDB vS NodeJS*. The classic Mongoose "Person" exercise set: schema definition, create/read/update/delete operations, and chained query helpers, all using Node-style `(err, data)` callbacks as required by the brief.

## Files

| File | Role |
|---|---|
| `models/person.js` | `Person` schema: `name` (required String), `age` (Number), `favoriteFoods` ([String]) |
| `myApp.js` | All required operations (see below), each using a Node-style callback |
| `tests.js` | 20 real integration assertions against a real, ephemeral MongoDB (`mongodb-memory-server`) |
| `.env.example` | Shape of the `MONGO_URI` variable (see substitution note below) |

## Operations implemented in `myApp.js`

- `createAndSavePerson` — build a `Person`, `.save()` it.
- `createManyPeople` — `Person.create(arrayOfPeople, ...)`.
- `findPeopleByName` — `Person.find({ name })`.
- `findOneByFood` — `Person.findOne({ favoriteFoods: food })`.
- `findPersonById` — `Person.findById(id)`.
- `findEditThenSave` — find by id, `push('hamburger')` onto `favoriteFoods`, `.save()`.
- `findAndUpdate` — `Person.findOneAndUpdate({ name }, { age: 20 }, { new: true })`.
- `removeById` — `Person.findByIdAndRemove(id)`.
- `removeManyPeople` — `Person.remove({ name: 'Mary' })`.
- `queryChain` — `.find({ favoriteFoods: 'burritos' }).sort({ name: 1 }).limit(2).select({ age: 0 }).exec()`.

## Why Mongoose is pinned to `^6.13.8`

The brief requires Node-style callbacks (`function(err, data) {...}`) on every Mongoose call — `person.save(callback)`, `Model.find(filter, callback)`, etc. **Mongoose 7 removed callback support entirely** (promises only). Pinning to the latest Mongoose 6.x keeps callback support while staying on a maintained, security-patched release (`npm audit` → 0 vulnerabilities).

## Why a local/in-memory MongoDB instead of a real Atlas cluster

The instructions ask for a MongoDB Atlas URI in `.env` as `MONGO_URI`. No real Atlas cluster or credentials were available for this checkpoint, so:
- `.env.example` documents the exact Atlas connection-string shape the app expects (`mongodb+srv://<user>:<pass>@<cluster>/<db>`), so plugging in a real cluster later is a one-line change — `myApp.js`'s `connect()` reads `process.env.MONGO_URI` directly.
- **Testing** uses `mongodb-memory-server`, which spins up a real, disposable `mongod` process per test run — genuine MongoDB wire-protocol behavior, not a mock — so every assertion in `tests.js` is checked against actual database reads/writes, not simulated ones.

## Results — real execution (verified, not simulated)

Run on 2026-11-03 with `node tests.js` against a real ephemeral MongoDB (`mongodb-memory-server`):

```
20/20 tests passed.
```

**Mutation test** (proving the suite actually discriminates correct from broken code): changed `findAndUpdate`'s `{ new: true }` option to `{ new: false }` in `myApp.js` (so it would return the *pre-update* document instead of the updated one). Re-ran `tests.js` — the `findAndUpdate: age was updated to 20` assertion failed as expected (`AssertionError`, `actual: false, expected: true`). Reverted the change and confirmed `20/20 tests passed.` again.

`npm audit` → 0 vulnerabilities.
