var request = require('request')
  , _ = require('lodash')
  , moment = require('moment')
  , JSONStream = require('JSONStream')

var creditCard = module.exports.creditCard = {}

creditCard.worst = function (options, next) {
  options = options || {}

  var start = options.start ? moment(options.start) : moment().subtract('years', 1)
    , end = options.end ? moment(options.end) : moment()
    , query = 'date_received>=\'' + start.format('YYYY-MM-DD') + '\' AND date_received<=\'' + end.format('YYYY-MM-DD') + '\''

  var totals = {}
    , lastErr

  get(query, 'company', null, null, function (err) {
      if (lastErr) { return }

      lastErr = err
      next(err)
    })
    .on('data', function (data) {
      if (lastErr) { return }

      var total = totals[data.company]
      totals[data.company] = total ? total + 1 : 1
    })
    .on('end', function () {
      if (lastErr) { return }

      next(null, totals)
    })
    .on('error', function (err) {
      if (lastErr) { return }

      lastErr = err
      next(err)
    })
}

creditCard.recent = function (options, next) {
  options = _.extend({ limit: 20 }, options || {})

  var recent = []
    , lastErr
  // TODO look into event-stream
  get('product=\'Credit card\'', ['date_received', 'company', 'issue', 'company_response', 'consumer_disputed'], options.limit, 'date_received DESC', function (err) {
      if (lastErr) { return }

      lastErr = err
      next(err)
    })
    .on('data', function (data) {
      if (lastErr) { return }

      recent.push({
        date: data.date_received,
        issue: data.issue,
        company: data.company,
        response: data.company_response,
        disputed: data.consumer_disputed ? true : false
      })
    })
    .on('end', function () {
      if (lastErr) { return }

      next(null, recent)
    })
    .on('error', function (err) {
      if (lastErr) { return }

      lastErr = err
      next(err)
    })
}

function get(query, select, limit, order, errorHandler) {
  select = _.isArray(select) ? select : [select]

  return request('http://data.consumerfinance.gov/resource/x3w3-u78g.json?'
      + '$where=' + encodeURIComponent(query)
      + '&$select=' + select.join()
      + (order ? '&$order=' + order : '')
      + (limit ? '&$limit=' + limit : ''))
    .on('error', function (err) {
      if (lastErr) { return }

      lastErr = err
      next(err)
    })
    .pipe(JSONStream.parse([true]))
}