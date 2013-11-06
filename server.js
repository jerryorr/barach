var express = require('express')
  , routes = require('./lib/routes')

var app = express()

app.get('/complaints/creditCard/worst', routes.creditCard.worst)
app.get('/complaints/creditCard/recent', routes.creditCard.recent)
app.get('/flu', routes.flu)

var port = process.env.PORT || 5000
app.listen(port)
console.log('Listening on port ' + port)