var mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , passportLocalMongoose = require('passport-local-mongoose');

var editor = new Schema({
  isAdmin: {type: Boolean, required: true, default: false},
  startup: {type: Boolean, required: true, default: false},
  lovesPie: {type: Boolean, required: true, default: true},
  profileId: String
});

editor.plugin(passportLocalMongoose);

module.exports = mongoose.model('Editor', editor);
