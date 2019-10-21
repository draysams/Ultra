'use strict'

import * as io from 'socket.io-client'
import * as Terminal from 'xterm/dist/xterm'
import * as fit from 'xterm/dist/addons/fit/fit'
import { library, dom } from '@fortawesome/fontawesome-svg-core'
import { faBars, faClipboard, faDownload, faKey, faCog } from '@fortawesome/free-solid-svg-icons'
library.add(faBars, faClipboard, faDownload, faKey, faCog)
dom.watch()

var unidecode = require('unidecode');

require('xterm/dist/xterm.css')
require('../css/style.css')
require('../css/sb-admin-2.css')
let ejs = require('../js/ejs.min.js')
// var script = document.createElement('script');
// script.src = 'https://code.jquery.com/jquery-3.4.1.min.js';
// script.type = 'text/javascript';
// document.getElementsByTagName('head')[0].appendChild(script);

// require('../css/jquery.qtip.min.css')
// require('./jquery.qtip.min.js')

Terminal.applyAddon(fit)

/* global Blob, logBtn, credentialsBtn, reauthBtn, downloadLogBtn */
var sessionLogEnable = false
var loggedData = false
var allowreplay = false
var allowreauth = false
var sessionLog, sessionFooter, logDate, currentDate, myFile, errorExists
var socket, termid // eslint-disable-line
var term = new Terminal()
// DOM properties
var status = document.getElementById('status')
var header = document.getElementById('header')
var dropupContent = document.getElementById('dropupContent')
var footer = document.getElementById('footer')
var terminalContainer = document.getElementById('terminal-container')
term.open(terminalContainer)
term.focus()
term.fit()

var pretty = document.getElementById('pretty')


window.addEventListener('resize', resizeScreen, false)

let info = [];
let processes = [];

function getInfo(row, col) {
  if (row < info.length && col < info[row].length) {
    return info[row][col]
  }
  return ''; 
}

function getProcess(row, col) {
  if (row < processes.length && col < processes[row].length) {
    return processes[row][col]
  }
  return ''; 
}

function beautify(topText) {
  // term.selectAll();
  // let selection = window.getSelection().toString();
  // console.log("selection is " + selection);
  // pretty.innerHTML = selection;
  // pretty.innerHTML = topText;
  // // console.log(term.buffer.getLine(term.buffer.length - 1).translateToString());
  // return;
  let lines = topText.split("\n");
  let firstLineIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("top")) {
      firstLineIndex = i;
      console.log("first line index " + firstLineIndex);
      break;
    }
  }

  for (let i = firstLineIndex; i < firstLineIndex + 5; i++) {

    if (i >= lines.length) break;
    let line = lines[i].match(/\S+/g) || [];
    if (line.length > 0 || i > info.length) {
      if (i > info.length) {
        info.push(line)
      } else {
        info[i] = line
      }
    }
  }

  let firstProcessIndex = firstLineIndex + 7;
  for (let i = firstProcessIndex; i < lines.length; i++) {
    let line = lines[i].match(/\S+/g) || [];
    if (line.length > 0 || i > processes.length) {
      if (i > processes.length) {
        processes.push(line)
      } else {
        processes[i] = line
      }
    }
  }

  console.log(info);

  let htmlString = `
  <br>
  <div>
  <div class="row">
  <div class="col-12">
  <h4>Mouseover the <span style="color: #fd7e14; font-weight:bold;" id="orange-label"> orange labels</span> to view explanations.</h4>
  </div>
  </div>
  <hr>
  <div class="row">
  <div class="col-4">
  <p><b>Current time:</b> ` + getInfo(0,2) + ` </p>
  </div>
  <div class="col-4">
  <p><b>System uptime:</b> ` + getInfo(0,4) + " " +  getInfo(0,5) + " " + getInfo(0,6).slice(0, -1) + ` </p>
  </div>
  <div class="col-4">
  <p><b>Connected users:</b> ` + getInfo(0,7) + " " + getInfo(0,8).slice(0, -1) + ` </p>
  </div>
  </div>
  <div class="row">
  <div class="col-12">
  <p><b><span id="system-load-average" style="color: #fd7e14;">System load average</span> over the last</b></p>
  </div>
  </div>
  <div class="row">
  <div class="col-4">
  <p><b>1 min:</b> ` + getInfo(0,11).slice(0, -1) + `</p>
  </div>
  <div class="col-4">
  <p><b>5 min:</b> ` + getInfo(0,12).slice(0, -1) + `</p>

  </div>
  <div class="col-4">
  <p><b>15 min:</b> ` + getInfo(0,13) + `</p>

  </div>
  </div>

  <div class="row">

  <div class="col-12">
  <table class="table table-responsive table-dark table-condensed">
  <caption>Tasks</caption>
  <thead>
  <tr>
  <th scope="col" id="tasks-total">Total</th>
  <th scope="col" id="tasks-running">Running</th>
  <th scope="col" id="tasks-sleeping">Sleeping</th>
  <th scope="col" id="tasks-stopped">Stopped</th>
  <th scope="col" id="tasks-zombie">Zombie</th>
  </tr>
  </thead>
  <tbody>
  <tr>
  <td>` + getInfo(1,1) + `</td>
  <td>` + getInfo(1,3) + `</td>
  <td>` + getInfo(1,5) + `</td>
  <td>` + getInfo(1,7) + `</td>
  <td>` + getInfo(1,9) + `</td>
  </tr>
  </tbody>
  </table>

  </div>

  </div>


  <div class="row">
  <div class="col-12">
  <table class="table table-responsive table-dark table-condensed">
  <caption>CPU</caption>
  <thead>
  <tr>
  <th scope="col" id="cpu-us">us</th>
  <th scope="col" id="cpu-sy">sy</th>
  <th scope="col" id="cpu-ni">ni</th>
  <th scope="col" id="cpu-wa">wa</th>
  <th scope="col" id="cpu-hi">hi</th>
  <th scope="col" id="cpu-si">si</th>
  <th scope="col" id="cpu-st">st</th>
  </tr>
  </thead>
  <tbody>
  <tr>
  <td>` + getInfo(2,1) + `</td>
  <td>` + getInfo(2,3) + `</td>
  <td>` + getInfo(2,5) + `</td>
  <td>` + getInfo(2,7) + `</td>
  <td>` + getInfo(2,9) + `</td>
  <td>` + getInfo(2,11) + `</td>
  <td>` + getInfo(2,13) + `</td>
  </tr>
  </tbody>

  </table>

  </div>

  </div>


  <div class="row">
  <div class="col-12">
  <table class="table table-responsive table-dark table-condensed">
  <caption>KiB Mem</caption>
  <thead>
  <tr>
  <th scope="col" id="mem-total">total</th>
  <th scope="col" id="mem-free">free</th>
  <th scope="col" id="mem-used">used</th>
  <th scope="col" id="mem-buff-cache">buff/cache</th>
  </tr>
  </thead>
  <tbody>
  <tr>
  <td>` + getInfo(3,3) + `</td>
  <td>` + getInfo(3,5) + `</td>
  <td>` + getInfo(3,7) + `</td>
  <td>` + getInfo(3,9) + `</td>
  </tr>
  </tbody>
  </table>

  </div>

  </div>

  <div class="row">
  <div class="col-12">
  <table class="table table-responsive table-dark table-condensed">
  <caption>KiB Swap</caption>
  <thead>
  <tr>
  <th scope="col" id="swap-total">total</th>
  <th scope="col" id="swap-free">free</th>
  <th scope="col" id="swap-used">used</th>
  <th scope="col" id="swap-avail-mem">avail Mem</th>
  </tr>
  </thead>
  <tbody>
  <tr>
  <td>` + getInfo(4,2) + `</td>
  <td>` + getInfo(4,4) + `</td>
  <td>` + getInfo(4,6) + `</td>
  <td>` + getInfo(4,8) + `</td>
  </tr>
  </tbody>
  </table>

  </div>

  </div>

  <div class="row">
  <div class="col-12">
  <table class="table table-responsive table-dark table-condensed table-processes">
  <caption>Currently running processes</caption>
  <thead>
  <tr>
  <th scope="col" id="pid">PID</th>
  <th scope="col" id="user">USER</th>
  <th scope="col" id="pr">PR</th>
  <th scope="col" id="ni">NI</th>
  <th scope="col" id="virt">VIRT</th>
  <th scope="col" id="res">RES</th>
  <th scope="col" id="shr">SHR</th>
  <th scope="col" id="s">S</th>
  <th scope="col" id="cpu">%CPU</th>
  <th scope="col" id="mem">%MEM</th>
  <th scope="col" id="time">TIME+</th>
  <th scope="col" id="command">COMMAND</th>
  </tr>
  </thead>
  <tbody>` 


  for (let i=0; i < processes.length; i++) { 
    htmlString + `<tr>`
    for (let j=0; j < processes[i].length; j++) { 
      htmlString += `<td>` + getProcess(i,j) + `</td>`
    } 
    htmlString += `</tr>`
  } 

  htmlString += 
  `</tbody>
  </table>
  </div>
  </div>

  </div>
  `;


  let html = ejs.render(htmlString, {processes: processes, info: info});
  pretty.innerHTML = html;
  $('#orange-label').qtip({ // Grab some elements to apply the tooltip to
    content: {
      text: 'Documentation shows up like this.'
    }
  });
  $('#system-load-average').qtip({ // Grab some elements to apply the tooltip to
    content: {
      text: 'Load average is usually interpreted relative to the number of cores. For example, if your system has 4 cores and the load average is 3, then the cores were utilized 75% of the time during that period.'
    }
  });
  $('#pid').qtip({ // Grab some elements to apply the tooltip to
    content: {
      text: 'This is a unique number used to identify the process.'
    }
  });
  $('#user').qtip({ // Grab some elements to apply the tooltip to
    content: {
      text: 'The username of whoever launched the process.'
    }
  });
  $('#pr').qtip({ // Grab some elements to apply the tooltip to
    content: {
      text: 'The priority of the process. Processes with higher priority will be favored by the kernel and given more CPU time than processes with lower priority. The lower this value, the higher the actual priority; the highest priority on *nix is -20 and the lowest is 20.'
    }
  });
  $('#ni').qtip({ // Grab some elements to apply the tooltip to
    content: {
      text: 'The “nice” value of a process. The nice value affects the priority of a process.'
    }
  });

  $('#virt').qtip({ // Grab some elements to apply the tooltip to
    content: {
      text: 'The total amount of virtual memory used by the process.'
    }
  });
  $('#res').qtip({ // Grab some elements to apply the tooltip to
    content: {
      text: 'The memory consumed by the process in RAM.'
    }
  });
  $('#shr').qtip({ // Grab some elements to apply the tooltip to
    content: {
      text: 'The amount of memory shared with other processes.'
    }
  });
  $('#s').qtip({ // Grab some elements to apply the tooltip to
    content: {
      text: 'The process state in the single-letter form.'
    }
  });
  $('#cpu').qtip({ // Grab some elements to apply the tooltip to
    content: {
      text: 'The percentage of your CPU that is being used by the process. By default, top displays this as a percentage of a single CPU. On multi-core systems, you can have percentages that are greater than 100%. For example, if 3 cores are at 60% use, top will show a CPU use of 180%. See here for more information. You can toggle this behavior by hitting Shift-i while top is running to show the overall percentage of available CPUs in use.'
    }
  });
  $('#mem').qtip({ // Grab some elements to apply the tooltip to
    content: {
      text: 'RES as a percentage of the total RAM available.'
    }
  });
  $('#time').qtip({ // Grab some elements to apply the tooltip to
    content: {
      text: 'The total CPU time used by the process since it started, precise to the hundredths of a second.'
    }
  });
  $('#command').qtip({ // Grab some elements to apply the tooltip to
    content: {
      text: 'The name of the process.'
    }
  });
  $('#tasks-total').qtip({ // Grab some elements to apply the tooltip to
    content: {
      text: 'Total number of running processes.'
    }
  });
  $('#tasks-running').qtip({ // Grab some elements to apply the tooltip to
    content: {
      text: 'A process in this state is either executing on the CPU, or it is present on the run queue, ready to be executed.'
    }
  });
  $('#tasks-sleeping').qtip({ // Grab some elements to apply the tooltip to
    content: {
      text: 'Processes in this state are waiting for an event to complete.'
    }
  });
  $('#tasks-stopped').qtip({ // Grab some elements to apply the tooltip to
    content: {
      text: 'These processes have been stopped by a job control signal (such as by pressing Ctrl+Z) or because they are being traced.'
    }
  });
  $('#tasks-zombie').qtip({ // Grab some elements to apply the tooltip to
    content: {
      text: 'The kernel maintains various data structures in memory to keep track of processes. A process may create a number of child processes, and they may exit while the parent is still around. However, these data structures must be kept around until the parent obtains the status of the child processes. Such terminated processes whose data structures are still around are called zombies.'
    }
  });
  $('#cpu-us').qtip({ // Grab some elements to apply the tooltip to
    content: {
      text: 'Time running un-niced user processes'
    }
  });
  $('#cpu-sy').qtip({ // Grab some elements to apply the tooltip to
    content: {
      text: 'Time running kernel processes.'
    }
  });
  $('#cpu-ni').qtip({ // Grab some elements to apply the tooltip to
    content: {
      text: 'Time running niced user processes.'
    }
  });
  $('#cpu-wa').qtip({ // Grab some elements to apply the tooltip to
    content: {
      text: 'Time waiting for I/O completion.'
    }
  });
  $('#cpu-hi').qtip({ // Grab some elements to apply the tooltip to
    content: {
      text: 'Time spent servicing hardware interrupts.'
    }
  });
  $('#cpu-si').qtip({ // Grab some elements to apply the tooltip to
    content: {
      text: 'Time spent servicing software interrupts.'
    }
  });
  $('#cpu-st').qtip({ // Grab some elements to apply the tooltip to
    content: {
      text: 'Time stolen from this vm by the hypervisor.'
    }
  });
  $('#mem-total').qtip({ // Grab some elements to apply the tooltip to
    content: {
      text: 'Total RAM.'
    }
  });
  $('#mem-free').qtip({ // Grab some elements to apply the tooltip to
    content: {
      text: 'Free RAM.'
    }
  });
  $('#mem-used').qtip({ // Grab some elements to apply the tooltip to
    content: {
      text: 'Used RAM.'
    }
  });
  $('#mem-buff-cache').qtip({ // Grab some elements to apply the tooltip to
    content: {
      text: 'The kernel tries to reduce disk access times in various ways. It maintains a “disk cache” in RAM, where frequently used regions of the disk are stored. In addition, disk writes are stored to a “disk buffer”, and the kernel eventually writes them out to the disk. The total memory consumed by them is the “buff/cache” value.'
    }
  });
  $('#swap-total').qtip({ // Grab some elements to apply the tooltip to
    content: {
      text: 'Total swap space.'
    }
  });
  $('#swap-free').qtip({ // Grab some elements to apply the tooltip to
    content: {
      text: 'Free swap space.'
    }
  });
  $('#swap-used').qtip({ // Grab some elements to apply the tooltip to
    content: {
      text: 'Used swap space.'
    }
  });
  $('#swap-avail-mem').qtip({ // Grab some elements to apply the tooltip to
    content: {
      text: 'The amount of memory that can be allocated to processes without causing more swapping.'
    }
  });
}

function resizeScreen () {
  // term.fit()
  // socket.emit('resize', { cols: term.cols, rows: term.rows })
}

if (document.location.pathname) {
  var parts = document.location.pathname.split('/')
  var base = parts.slice(0, parts.length - 1).join('/') + '/'
  var resource = base.substring(1) + 'socket.io'
  socket = io.connect(null, {
    resource: resource
  })
} else {
  socket = io.connect()
}

term.on('data', function (data) {
  socket.emit('data', data)
})

socket.on('data', function (data) {
  term.write(data)
  // beautify(data)

  if (data.includes('top - ')) {
    console.log("FOUND THE TOP");
    var topOutput = data.replace(/[\u001b\u009b][[\]()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><;]/g, '')
    beautify(topOutput)
  }

  if (sessionLogEnable) {
    sessionLog = sessionLog + data
  }
})

socket.on('connect', function () {
  socket.emit('geometry', term.cols, term.rows)
})

socket.on('setTerminalOpts', function (data) {
  term.setOption('cursorBlink', data.cursorBlink)
  term.setOption('scrollback', data.scrollback)
  term.setOption('tabStopWidth', data.tabStopWidth)
  term.setOption('bellStyle', data.bellStyle)
})

// term.attachCustomKeyEventHandler(e => {
//   console.log(e);
//   return true;
// });

socket.on('title', function (data) {
  document.title = data
})

socket.on('menu', function (data) {
  drawMenu(data)
})

socket.on('status', function (data) {
  status.innerHTML = data
})

socket.on('ssherror', function (data) {
  status.innerHTML = data
  status.style.backgroundColor = 'red'
  errorExists = true
})

socket.on('headerBackground', function (data) {
  header.style.backgroundColor = data
})

socket.on('header', function (data) {
  if (data) {
    header.innerHTML = data
    header.style.display = 'block'
    // header is 19px and footer is 19px, recaculate new terminal-container and resize
    terminalContainer.style.height = 'calc(100% - 38px)'
    resizeScreen()
  }
})

socket.on('footer', function (data) {
  sessionFooter = data
  footer.innerHTML = data
})

socket.on('statusBackground', function (data) {
  status.style.backgroundColor = data
})

socket.on('allowreplay', function (data) {
  if (data === true) {
    console.log('allowreplay: ' + data)
    allowreplay = true
    drawMenu(dropupContent.innerHTML + '<a id="credentialsBtn"><i class="fas fa-key fa-fw"></i> Credentials</a>')
  } else {
    allowreplay = false
    console.log('allowreplay: ' + data)
  }
})

socket.on('allowreauth', function (data) {
  if (data === true) {
    console.log('allowreauth: ' + data)
    allowreauth = true
    drawMenu(dropupContent.innerHTML + '<a id="reauthBtn"><i class="fas fa-key fa-fw"></i> Switch User</a>')
  } else {
    allowreauth = false
    console.log('allowreauth: ' + data)
  }
})

socket.on('disconnect', function (err) {
  if (!errorExists) {
    status.style.backgroundColor = 'red'
    status.innerHTML =
    'WEBSOCKET SERVER DISCONNECTED: ' + err
  }
  socket.io.reconnection(false)
})

socket.on('error', function (err) {
  if (!errorExists) {
    status.style.backgroundColor = 'red'
    status.innerHTML = 'ERROR: ' + err
  }
})

socket.on('reauth', function () {
  (allowreauth) && reauthSession()
})

term.on('title', function (title) {
  document.title = title
})

// draw/re-draw menu and reattach listeners
// when dom is changed, listeners are abandonded
function drawMenu (data) {
  dropupContent.innerHTML = data
  logBtn.addEventListener('click', toggleLog)
  allowreauth && reauthBtn.addEventListener('click', reauthSession)
  allowreplay && credentialsBtn.addEventListener('click', replayCredentials)
  loggedData && downloadLogBtn.addEventListener('click', downloadLog)
}

// reauthenticate
function reauthSession () { // eslint-disable-line
  console.log('re-authenticating')
  window.location.href = '/reauth'
  return false
}

// replay password to server, requires
function replayCredentials () { // eslint-disable-line
  socket.emit('control', 'replayCredentials')
  console.log('replaying credentials')
  term.focus()
  return false
}

// Set variable to toggle log data from client/server to a varialble
// for later download
function toggleLog () { // eslint-disable-line
  if (sessionLogEnable === true) {
    sessionLogEnable = false
    loggedData = true
    logBtn.innerHTML = '<i class="fas fa-clipboard fa-fw"></i> Start Log'
    console.log('stopping log, ' + sessionLogEnable)
    currentDate = new Date()
    sessionLog = sessionLog + '\r\n\r\nLog End for ' + sessionFooter + ': ' +
    currentDate.getFullYear() + '/' + (currentDate.getMonth() + 1) + '/' +
    currentDate.getDate() + ' @ ' + currentDate.getHours() + ':' +
    currentDate.getMinutes() + ':' + currentDate.getSeconds() + '\r\n'
    logDate = currentDate
    term.focus()
    return false
  } else {
    sessionLogEnable = true
    loggedData = true
    logBtn.innerHTML = '<i class="fas fa-cog fa-spin fa-fw"></i> Stop Log'
    downloadLogBtn.style.color = '#000'
    downloadLogBtn.addEventListener('click', downloadLog)
    console.log('starting log, ' + sessionLogEnable)
    currentDate = new Date()
    sessionLog = 'Log Start for ' + sessionFooter + ': ' +
    currentDate.getFullYear() + '/' + (currentDate.getMonth() + 1) + '/' +
    currentDate.getDate() + ' @ ' + currentDate.getHours() + ':' +
    currentDate.getMinutes() + ':' + currentDate.getSeconds() + '\r\n\r\n'
    logDate = currentDate
    term.focus()
    return false
  }
}

// cross browser method to "download" an element to the local system
// used for our client-side logging feature
function downloadLog () { // eslint-disable-line
  if (loggedData === true) {
    myFile = 'WebSSH2-' + logDate.getFullYear() + (logDate.getMonth() + 1) +
    logDate.getDate() + '_' + logDate.getHours() + logDate.getMinutes() +
    logDate.getSeconds() + '.log'
    // regex should eliminate escape sequences from being logged.
    var blob = new Blob([sessionLog.replace(/[\u001b\u009b][[\]()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><;]/g, '')], { // eslint-disable-line no-control-regex
      type: 'text/plain'
    })
    if (window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveBlob(blob, myFile)
    } else {
      var elem = window.document.createElement('a')
      elem.href = window.URL.createObjectURL(blob)
      elem.download = myFile
      document.body.appendChild(elem)
      elem.click()
      document.body.removeChild(elem)
    }
  }
  term.focus()
}
