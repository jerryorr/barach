var complaints = require('./complaints')
  , _ = require('lodash')
  , moment = require('moment')
  , flu = require('./flu')
  , Cache = require('./cache')
  , schedule = require('node-schedule')

module.exports.status = function (req, res) {
  res.send(200, 'OK')
}

var cache = new Cache()
  , lastScheduledMinute = 0

function scheduleJob (id, job) {
  var rule = new schedule.RecurrenceRule()
  rule.minute = ++lastScheduledMinute
  cache.register(id, rule, job)
}

var creditCard = module.exports.creditCard = {}

creditCard.worst = function (req, res) {
  worst(req, res, 'creditCard')
}

creditCard.recent = function (req, res) {
  recent(req, res, 'creditCard')
}

var mortgage = module.exports.mortgage = {}

mortgage.worst = function (req, res) {
  worst(req, res, 'mortgage')
}

mortgage.recent = function (req, res) {
  recent(req, res, 'mortgage')
}

function worst(req, res, type) {
  var options = {type: type}

  cache.get(type + ':worst', function (err, data) {
      if (err) {
        console.log(err)
        return res.send(500, err.toString())
      }
      res.setHeader('Content-Type', 'text/csv')
      res.write('Company,Complaints\n')
      data && res.write(data)
      res.end()
  })
}

function worstJob (type, done) {
  var options = { type: type }
  complaints.worst(options, function (err, totals) {
    if (err) {
      return done(err)
    }

    var csv = _(totals)
    .pairs()
    .sortBy(function (total) {
      return total[1]
    })
    .reverse()
    .map(function (total) {
      return csvOut(total[0]) + ',' + total[1]
    }).value().join('\n')

    done(null, csv)
  })
}


scheduleJob('creditCard:worst', _.partial(worstJob, 'creditCard'))
scheduleJob('mortgage:worst', _.partial(worstJob, 'mortgage'))

function recent (req, res, type) {
  var options = {type: type}

  cache.get(type + ':recent', function (err, data) {
    if (err) {
      console.log(err)
      return res.send(500, err.toString())
    }

    res.setHeader('Content-Type', 'text/csv')
    res.write('Date,Company,Issue,Response\n')
    res.write(data)
    res.write('\n')

    res.end()
  })
}

function recentJob (type, done) {
  var options = { type: type }

  complaints.recent(options, function (err, data) {
    var csv = _(data)
    .map(function (complaint) {
      return moment(complaint.date).format('M/D')
        + ',' + csvOut(complaint.company)
        + ',' + csvOut(complaint.issue)
        + ',' + csvOut(complaint.response)
    }).value().join('\n')

    done(null, csv)
  })
}

scheduleJob('creditCard:recent', _.partial(recentJob, 'creditCard'))
scheduleJob('mortgage:recent', _.partial(recentJob, 'mortgage'))

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

function csvOut (str) {
  return '"' + str.replace(/"/g, '""') + '"'
}


// TODO this is just a quick hack to get it to show up.
// I want to merge this with the Google Flu data
var Stream = require('stream')
  , request = require('request')
  , JSONStream = require('JSONStream')
  , es = require('event-stream')

module.exports.wikipediaFlu = function (req, res) {
  var st = Stream.PassThrough({objectMode: true})
  st.push('Date,Value\n')

  var request = require('request')

  request({
      url: 'http://www.additiveanalytics.com/solutions/flu_tracker_data',
      // their SSL cert is expired... and I don't care
      rejectUnauthorized: false
    })
    .pipe(JSONStream.parse([true]))
    .pipe(es.map(function (d, next) {
      next(null, d.view_date + ',' + d.daily_views)
    }))
    .pipe(es.join('\n'))
    .pipe(st)
    .pipe(res)
}