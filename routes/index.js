
/*
 * GET home page.
 */

var fs = require('fs');
var path = require('path');
var Person = require('../models/Person.js');
var _ = require('lodash');

exports.index = function(req, res) {
  res.render('index', { title: 'Express' });
};

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
};

exports.loadTalent = function(req, res) {
  console.log(req.query.offset);
  
  var lim = 25;
  
  if(req.query.noLimit)
    console.log('no limit!!!'), lim = 0;
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
  console.log(req.query);
  
  var lim = 25;
  if(req.query.noLimit) lim = 0;
  
  var mc;
  if(req.query.minorAndCerts) mc =  req.query.minorAndCerts.split(',').join('|');
  
  Person.find({
    name: new RegExp(req.query.name, 'i'), 
    major: new RegExp(req.query.major, 'i'), 
    minorAndCerts: new RegExp(mc, 'i')
  })
  .skip(req.query.offset).limit(lim)
  .exec(function(err, peeps) {
    if(err) console.log(err);
    res.send(peeps);
  });
}
