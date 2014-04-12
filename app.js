
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , mongoose = require('mongoose');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

// connect to db
// for local to work, mongod (mongodaemon) must be running on port 27017
var uristring =
	process.env.MONGOLAB_URI ||
	process.env.MONGOHQ_URL  ||
	'mongodb://localhost/talentPool';

mongoose.connect(uristring, function(err, res) {
  if(err) console.log(err);
  routes.importTalent();
});

app.get('/', routes.index);
app.get('/users', user.list);
app.get('/partials/:partial', function(req, res) {
  res.render('partials/' + req.params.partial);
});
app.get('/data', routes.loadTalent);
app.get('/data/size', routes.dbSize);
app.get('/data/filter', routes.filterTalent);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
