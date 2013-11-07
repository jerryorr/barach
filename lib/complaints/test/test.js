var complaints = require('../')
  , assert = require('assert')
  , _ = require('lodash')
  , nock = require('nock')

describe('complaints', function () {
  describe('creditCard', function () {
    describe('worst', function () {
      it.skip('calls actual service', function (done) {
        this.timeout(5000)
        complaints.worst({type: 'creditCard'}, function (err, results) {
          assert(!err)
          assert(results)
          assert(_.keys(results).length > 0)
          done()
        })
      })

      it('returns totals', function (done) {
        nock('http://data.consumerfinance.gov')
          .get('/resource/x3w3-u78g.json?$where=date_received%3E%3D%272012-11-07%27%20AND%20date_received%3C%3D%272013-11-07%27&$select=company')
          .replyWithFile(200, __dirname + '/creditCard.json')

        complaints.worst({
          type: 'creditCard',
          start: '2012-11-07',
          end: '2013-11-07'
        }, function (err, results) {
          assert(!err)
          assert(results)
          assert(_.keys(results).length > 0)
          assert.equal(results['Capital One'], 1)
          assert.equal(results['Amex'], 2)
          assert(!results['Fake Bank'])
          done()
        })
      })
    })

    describe('recent', function () {
      it('calls actual service', function (done) {
        this.timeout(5000)
        complaints.recent({type: 'mortgage'}, function (err, results) {
          assert(!err)
          assert(results)
          assert.equal(results.length, 20)
          done()
        })
      })
    })
  })
})