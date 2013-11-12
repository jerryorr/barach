var schedule = require('node-schedule')


var Cache = module.exports = function () {
  this.data = {}
}

Cache.prototype.register = function (id, rule, load) {
  var self = this

  var done = function (err, data) {
    console.log('job ' + id + ' complete')
    if (err) {
      console.log('Error loading data for job ' + id)
      console.log(err)
      return
    }

    self.data[id] = data
  }

  load(done)

  var j = schedule.scheduleJob(rule, function () {
    console.log('job ' + id + ' starting')
    load(done)
  })
}

Cache.prototype.get = function (id, next) {
  // TODO add logic to wait for job to run if no data yet
  next(null, this.data[id])
}