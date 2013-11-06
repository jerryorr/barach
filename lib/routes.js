var complaints = require('./complaints')
  , _ = require('lodash')
  , moment = require('moment')
  , flu = require('./flu')

var creditCard = module.exports.creditCard = {}

creditCard.worst = function (req, res) {
  var options = {}

  complaints.creditCard.worst({}, function (err, totals) {
    if (err) {
      console.log(err)
      return res.send(500, err.toString())
    }

    res.setHeader('Content-Type', 'text/csv')
    res.write('Company,Complaints\n')

    _(totals)
    .pairs()
    .sortBy(function (total) {
      return total[1]
    })
    .reverse()
    .each(function (total) {
      res.write(total[0].replace(',', '') + ',' + total[1] + '\n')
    })

    res.end()
  })
}

creditCard.recent = function (req, res) {
  var options = {}

  complaints.creditCard.recent({}, function (err, complaints) {
    if (err) {
      console.log(err)
      return res.send(500, err.toString())
    }

    res.setHeader('Content-Type', 'text/csv')
    res.write('Date,Company,Issue,Response\n')

    _(complaints)
    .each(function (complaint) {
      // TODO comma-sanitize all data
      res.write(moment(complaint.date).format('M/D')
        + ',' + complaint.company.replace(',', '')
        + ',' + complaint.issue
        + ',' + complaint.response + '\n')
    })

    res.end()
  })
}

module.exports.flu = function(req, res){
  var options = {}

  if (req.query.region) {
    options.regions = _.isArray(req.query.region) ? req.query.region : [req.query.region]
  }

  res.setHeader('Content-Type', 'text/csv')

  flu(options)
    .on('data', function (data) {
      res.write(data)
      res.write('\n')
    })
    .on('end', function (data) {
      res.end()
    })
    .on('error', function (err) {
      console.log('error: ', error)
    })
}