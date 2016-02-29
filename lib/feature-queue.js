var Resque = require('node-resque').queue
var Work = require('./work.js')

module.exports = {
  create: function (options) {
    var log = options.log
    var work = new Work(options)
    if (!options.connection) {
      return {
        enqueue: function (foo, bar, job) {
          doLocal(work, job)
        },
        removeFailed: function () {},
        failed: function () {},
        length: function () {},
        allWorkingOn: function () {}
      }
    }
    var queue = new Resque({connection: work.connection}, work.jobs, function () {
      var age = 2 * 60 * 1000
      var interval = age / 4
      setInterval(function () {
        queue.cleanOldWorkers(age, function (err, results) {
          if (err) log.error(err)
          var numKilled = Object.keys(results).length
          if (numKilled > 0) log.error('Killed ' + numKilled + ' workers due to old age')
        }, interval)
      })
    })

    process.on('SIGINT', function () {
      queue.end(function () {
        process.exit()
      })
    })

    process.on('SIGTERM', function () {
      queue.end(function () {
        process.exit()
      })
    })

    queue.connect()

    return queue
  }
}

function doLocal (work, job) {
  work.importService(job[0], function (err) {
    if (err) console.log(err)
  })
}
