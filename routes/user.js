
/*
 * GET users listing.
 */

var Editor = require('../models/Editor.js');
var ObjectId = require('mongoose').Types.ObjectId;
var passport = require('passport');
var _ = require('lodash');
var qq = require('../lib/query.js');

exports.getSet = function(req, res) {
  var params = {};
  if(req.query.special === '90210ggbro1337') params.special = req.query.special;
  if(req.query.special === 'reg_startup22619') params.startup = req.query.special;
  params.email = req.query.email;

  if(params.special || params.startup) res.render('index', { req: JSON.stringify(params) });

  else if (!req.query.id) res.render('index', {err: 'Malformed: No id.'});

  else {
    qq.user.getById(req.query.id, function(err, response, body) {
      if(err) {
        console.log(err);
        res.render('index', {err: err});
      }
      body = JSON.parse(body)[0];
      if (!body) res.render('index', {err: 'No user found.'});
      if (body.raw.email !== params.email) res.render('index', {err: 'Incorrect user data. Cannot register.'});
      else res.render('index', { req: JSON.stringify(params) });
    })
  }
};

function createEditor(fields, pw, cb) {
  Editor.register(fields, pw, cb);
}

exports.postSet = function(req, res) {
  if(! (req.body.username && req.body.password) )
    res.statusCode = 500, res.send('Malformed: Missing fields.');
  else {
    var fields = { username: req.body.username, email: req.body.email };

    if(req.body.startup === 'reg_startup22619') {
      fields.startup = true;
      createEditor(fields, req.body.password,
        function(err, editor) {
          if(err) console.log(err), res.send({error: err});
          else passport.authenticate('local')(req, res, function() {
            var e = _.pick(editor, ['email', 'isAdmin', 'startup']);
            res.send(e);
          });
      });
    }

    else {
      if(req.body.special === '90210ggbro1337')
        fields.isAdmin = true;

      qq.user.getByEmail(fields.email, function(err, _response, person) {
        if(err) {
          console.log(err);
          res.send({error: 'An incorrect ID was provided. If you believe this to be an error, contact EPIC at contact@nuisepic.com for assistance.'});
        }
        else createEditor(fields, req.body.password,
          function(err, editor) {
            if(err) console.log(err), res.send({error: err});
            else passport.authenticate('local')(req, res, function() {
              var e = _.pick(editor, ['email', 'isAdmin', 'startup']);
              res.send(e);
            });
        });
      });
    }
  }
}

exports.update = function(req, res) {
  if (!req.body.email) res.statusCode = 500, res.send('Malformed: Missing email.');
  else {
    console.log(req.body.updates);
    qq.user.updateByEmail(req.body.email, req.body.updates, function (err, _response, body) {
      if(err) console.log(err);
      else {
        res.send(req.body.updates);
      }
    });
  }
}
