
/*
 * GET users listing.
 */

var Person = require('../models/Person.js');
var Editor = require('../models/Editor.js');
var ObjectId = require('mongoose').Types.ObjectId;
var passport = require('passport');
var _ = require('lodash');

exports.getSet = function(req, res) {
  if(!req.query.id) 
    res.statusCode = 500, res.send('Malformed: No id.');
  else {
    var params = {};
    if(req.query.special === '90210ggbro1337') params.special = req.query.special;
    if(req.query.special === 'reg_startup22619') params.startup = req.query.special;
    
    Person.findById(req.query.id).exec(function(err, person) {
      if(err) console.log(err), res.send(err);
      else {
        if(person) params.email = person.email;
        res.render('index', {req: JSON.stringify(params)});
      }
    });
  }
};

function createEditor(fields, pw, cb) {
  Editor.register(fields, pw, cb);
}

exports.postSet = function(req, res) {
  if(! (req.body.username && req.body.password) )
    res.statusCode = 500, res.send('Malformed: Missing fields.');
  else {
    var fields = { username: req.body.username };
      
    if(req.body.startup === 'reg_startup22619') {
      fields.startup = true;
      createEditor(fields, req.body.password, 
        function(err, editor) {
          if(err) console.log(err), res.send({error: err});
          else passport.authenticate('local')(req, res, function() {
            var e = _.pick(editor, ['profileId', 'isAdmin', 'startup']);
            res.send(e);
            return;
          });
      });
    }
    
    else {
      if(req.body.special === '90210ggbro1337')
        fields.isAdmin = true;

      Person.findOne({email: fields.username})
      .exec(function(err, person) {
        if(err) {
          console.log(err);
          res.send({error: 'An incorrect ID was provided. If you believe this to be an error, contact EPIC at contact@nuisepic.com for assistance.'});
        }
        else fields.profileId = person._id, createEditor(fields, req.body.password,
          function(err, editor) {
            if(err) console.log(err), res.send({error: err});
            else passport.authenticate('local')(req, res, function() {
              var e = _.pick(editor, ['profileId', 'isAdmin', 'startup']);
              res.send(e);
            });
        });
      });
    }
  }
}

exports.update = function(req, res) {
  if (!req.body._id) res.statusCode = 500, res.send('Malformed: Missing id.');
  else {
    console.log(req.body.updates);
    Person.update({_id: ObjectId(req.body._id)},
                  req.body.updates,
                  {upsert: true})
    .exec(function(err, result) {
      if(err) console.log(err);
      else {
        res.send(req.body.updates);
      }
    });
  }
}

