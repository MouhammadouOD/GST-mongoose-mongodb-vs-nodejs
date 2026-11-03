const mongoose = require('mongoose');

// Person schema per the checkpoint prototype:
// name: string [required], age: number, favoriteFoods: array of strings.
const personSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: Number,
  favoriteFoods: [String],
});

module.exports = mongoose.model('Person', personSchema);
