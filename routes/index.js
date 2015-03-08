var Person = require('../models/Person.js')
  , Editor = require('../models/Editor.js')
  , _ = require('lodash')
  , mongoose = require('mongoose')
  , request = require('request');

exports.index = function(req, res) {
  res.render('index');
};

exports.login = function(req, res) {
  if(req.isAuthenticated()) res.send(_.pick(req.user, ['profileId', 'isAdmin', 'startup']));
  else res.status(401).send('Login failed.');
}

exports.checkLogin = function(req, res) {
  console.log('CheckLogin', req.isAuthenticated());
  if(req.isAuthenticated()) res.send(_.pick(req.user, ['profileId', 'isAdmin', 'startup']));
  else res.status(401).send('Not logged in.');
}

exports.importTalent = function(req, res) {
  Editor.register({username: 'tester', startup: true}, 'testme!', function(err) {
    if(err) console.log(err);
  });

  Person.findOne({name: 'jordan timmerman'}).exec(function(err, jordan) {
    console.log(jordan);
    Editor.register({username: 'jtim-admin', isAdmin: true, profileId: jordan._id}, 'br0,lemme1n', function(err) {
      if(err) console.log(err);
    });
    Editor.register({username: 'jtim@u.northwestern.edu', profileId: jordan._id}, 'br0,s3r1ously', function(err) {
      if(err) console.log(err);
    });
  });
};

exports.loadTalent = function(req, res) {
  if(!req.isAuthenticated()) res.status(401).send('Sorry, you are not authorized to go there.');
  var lim = 25;

  if(req.query.noLimit)
    lim = 0;

  var q = ['~skip:' + req.query.offset,
           '~limit:' + lim,
           '~sort:' + 'raw.name.last'].join(',');

  request.get('http://localhost:3000/scf/applications/' + q)
         .pipe(res);
};

function prm(k, v) {
  return ['raw.' + k, v.replace(/:|\s/g, '')].join(':');
}

function paramifyQuery(q) {
  var p = [];
  console.log(q);
  for (var k in q) {
    console.log(k);
    if ( k == 'name' ) {
      ns = q[k].split(' '), p = p.concat([prm('name.first', ns[0]), prm('name.last', ns[1] || '')]);
      continue;
    }
    console.log(prm(k, q[k]));
    p.push(prm(k, q[k]));
  }
  // NOTE(jordan): transform commas into 'OR'
  p.forEach(function(v, idx) { q[idx] = v.replace(/,/g, '|') });
  p = p.join(',');
  console.log(p);
  return p + (p.length > 0 ? '/' : '');
}

exports.dbSize = function(req, res) {

  var q = paramifyQuery(req.query);

  console.log('http://localhost:3000/scf/applications/' + q + 'count');

  request.get('http://localhost:3000/scf/applications/' + q + 'count')
         .pipe(res);
}

exports.filterTalent = function(req, res) {

  var lim = 25;
  if(req.query.noLimit) lim = 0, delete req.query.offset;
  var offset = req.query.offset;
  delete req.query.offset;

  var q = paramifyQuery(req.query);
  console.log(q);

  q = q.concat(['~limit:' + lim,
                '~skip:'  + offset,
                '~sort:'  + 'raw.name.last']);

  console.log('http://localhost:3000/scf/applications/' + q);

  request.get('http://localhost:3000/scf/applications/' + q)
         .pipe(res);
}
