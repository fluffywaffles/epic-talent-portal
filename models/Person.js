var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

//name, year, major, industries, technical, design, business, engineering, linkedin, email, minorAndCerts, international, needsVisa

var person = Schema({
	name: {type: String, required: true, lowercase: true, index: {unique: true, dropDups: true}},
	year: String,
	major: String,
	technical: [String],
	design: [String],
	business: [String],
	engineering: String,
	linkedin: String,
	email: {type: String, required: true, index: {unique: true, dropDups: true}},
	minorAndCerts: [String],
	international: String,
	needsVisa: String,
	resume: Schema.Types.Mixed
});

module.exports = mongoose.model('Person', person);
