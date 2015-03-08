
/*
 * GET home page.
 */

var fs = require('fs');
var path = require('path');
var Person = require('../models/Person.js');
var Editor = require('../models/Editor.js');
var _ = require('lodash');
var mongoose = require('mongoose');

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
  var talent = fs.readFileSync(path.join(__dirname, '../raw_csv/student-apps.json'));
  talent = JSON.parse(talent);
  _.each(talent, function(val, idx) {
    _.each(val, function(v, i) {
      if(v.indexOf(',') !== -1) v = v.split(',').map(function(val, idx) { return val.trim()});
      val[i] = v;
    });

    var person = new Person(val);
    person.save(function(err) {
      if(err) console.log(err);
    });
  });

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
  Person.find({}).skip(req.query.offset).limit(lim).sort([['name', 'ascending']]).exec(function(err, peeps) {
      res.send(peeps);
    });
};

exports.dbSize = function(req, res) {
  if(req.query) {
    var mc;
    if(req.query.minorAndCerts) mc =  req.query.minorAndCerts.split(',').join('|');
    Person.count({
      name: new RegExp(req.query.name, 'i'),
      major: new RegExp(req.query.major, 'i'),
      minorAndCerts: new RegExp(mc, 'i')
    }, function(err, num) {
      res.send(num.toString());
    })
  }
  else {
    Person.count({}, function(err, num) {
      if(err) console.log(err);
      //can't send num as a Number because it gets recognized as an HTTP Status Code! Ha! Getting the Status Code 768 is pretty alarming at first.
      res.send(num.toString());
    });
  }
}

exports.filterTalent = function(req, res) {

  var lim = 25;
  if(req.query.noLimit) lim = 0;

  var mc;
  if(req.query.minorAndCerts) mc =  req.query.minorAndCerts.split(',').join('|');

  var q = {
    name: new RegExp(req.query.name, 'i'),
    major: new RegExp(req.query.major, 'i'),
    minorAndCerts: new RegExp(mc, 'i')
  };

  if(req.query._id)
    q._id = mongoose.Types.ObjectId(req.query._id);

  console.log(q);

  Person.find(q)
  .skip(req.query.offset).limit(lim)
  .exec(function(err, peeps) {
    if(err) console.log(err);
    res.send(peeps);
  });
}
