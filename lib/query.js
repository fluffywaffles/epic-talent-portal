var request = require('request')
  , path    = require('path');

var q = {
  url: 'http://formula-one.herokuapp.com/',
  endpoint: 'scf/application/'
}
q.user = {
  getByEmail: function(email, cb) {
    return request.get(q.url + q.endpoint + 'raw.email:' + email, cb);
  },
  getById: function(id, cb) {
    return request.get(q.url + q.endpoint + '_id:' + id, cb);
  },
  updateByEmail: function(email, updates, cb) {
    var options = { url: q.url + q.endpoint + 'update/' + 'raw.email:' + email,
                    json: true,
                    body: updates
                  };
    console.log(options);
    return request.post(options, cb);
  }
}

q.applications = {
  query: function(query, fn) {
    console.log(query);
    return request.get(q.url + q.endpoint + query, fn);
  }
}

module.exports = q;
