var Editor = require('../models/Editor.js')
  , _ = require('lodash')
  , mongoose = require('mongoose')
  , path = require('path')
  , qq   = require('../lib/query.js')
  , request = require('request');

exports.index = function(req, res) {
  res.render('index');
};

exports.login = function(req, res) {
  console.log(req.user);
  console.log(_.pick(req.user, 'email', 'isAdmin', 'startup'));
  if(req.isAuthenticated()) res.send(_.pick(req.user, 'email', 'isAdmin', 'startup'));
  else res.status(401).send('Login failed.');
}

exports.checkLogin = function(req, res) {
  console.log('CheckLogin', req.isAuthenticated());
  if(req.isAuthenticated()) res.send(_.pick(req.user, ['email', 'isAdmin', 'startup']));
  else res.status(401).send('Not logged in.');
}

exports.loadTalent = function(req, res) {
  if(!req.isAuthenticated()) res.status(401).send('Sorry, you are not authorized to go there.');
  var lim = 25;

  if(req.query.noLimit)
    lim = 0;

  var q = ['~skip:' + req.query.offset,
           '~limit:' + lim,
           '~sort:' + 'raw.name.last'].join(',');

  qq.applications.query(q)
         .pipe(res);
};

function paramifyQuery(q) {

  function prm(k, v) {
    return ['raw.' + k, v.replace(/:|\s/g, '')].join(':');
  }

  var p = [];

  for (var k in q) {
    if ( k == 'name' ) {
      ns = q[k].split(' '), p = p.concat([prm('name.first', ns[0]), prm('name.last', ns[1] || '')]);
      continue;
    }
    p.push(prm(k, q[k]));
  }

  // NOTE(jordan): transform commas into 'OR'
  p.forEach(function(v, idx) { q[idx] = v.replace(/,/g, '|') });
  p = p.join(',');
  return p;
}

exports.dbSize = function(req, res) {

  var q = paramifyQuery(req.query);

  console.log('http://localhost:3000/' + path.join('scf/applications/' + q, '/count'));

  qq.applications.query(path.join(q, 'count'))
         .pipe(res);
}

exports.filterTalent = function(req, res) {

  var lim = 25;
  if(req.query.noLimit) lim = 0, delete req.query.offset;
  var offset = req.query.offset;
  delete req.query.offset;

  var q = paramifyQuery(req.query);
  console.log(q);

  q += ',' + ['~limit:' + lim,
              '~skip:'  + offset,
              '~sort:'  + 'raw.name.last'].join(',');

  console.log('http://localhost:3000/scf/applications/' + q);

  qq.applications.query(q)
         .pipe(res);
}
