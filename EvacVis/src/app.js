/* global $ */ // jquery.js

import React, {Component, } from 'react';
import DeckGL, {IconLayer, GeoJsonLayer} from 'deck.gl';
import {HeatmapLayer, ContourLayer} from '@deck.gl/aggregation-layers';
import {StaticMap} from "react-map-gl";
import * as d3 from "d3";
import {
  LayerControls,
  TRIPS_CONTROLS
} from './controls';
import {Panel} from "./panel"; // Control panel in the left upper corner
import {Legend} from "./legend";
import {Client} from "./client"
import {Chart} from "./chart";
import {Interface} from "./interface";
import Toast from "./toast";
import {scaleThreshold} from 'd3-scale';
import car4 from "../res/car4.png";
import car2 from "../res/car2.png";
import PinOrigin from "!file-loader!../res/pin_red.png";
import PinDestination from "!file-loader!../res/pin_blue.png";
import ShelterFull from "!file-loader!../res/shelter_full.png";
import ShelterOpen from "!file-loader!../res/shelter_open.png";

// const { promisify } = require('util')

const MAPBOX_ACCESS_TOKEN = "pk.eyJ1IjoibGVpemVuZ3hpYW5nIiwiYSI6ImNqNTM4NnV3YjA0Z2cyd3BnOXFuajg1YmoifQ.xC1N6Uxu4k-1LMjbSSM8NQ";

var ws = null; // websocket

// Initial viewport settings
const initialViewState = {
  longitude: -81.660895,
  latitude: 30.325941,
  zoom: 9,
  maxZoom: 16,
  pitch: 0,
  bearing: 0
};

//initialize link dictionary
const linkdict = new Map();
let zonelist = [];
let linklist = [];
// let zoneData = [];
let shelterdict = new Map(); // Trake the shelter info
let shelterlist = [];
/*for (var i = 0; i<linkData['features'].length; i++) {
  linkdict.set(linkData['features'][i]['properties']['Id'],0);
}*/
//console.log(linkdict)

// Speed color
export const COLOR_SCALE = scaleThreshold()
    .domain([0,10,20,30])
    .range([
      [200, 200, 200],
      [211, 0, 0],
      [211, 84, 0],
      [247, 210, 76],
      [112, 247, 76]
    ]);

// Contour thresholds
const CONTOURS = [
  {threshold: 60, color: [255, 0, 0, 255], strokeWidth: 1}, // => Isoline for threshold 1
  {threshold: 120, color: [0, 255, 0], strokeWidth: 2}, // => Isoline for threshold 5
  {threshold: [120, 600], color: [0, 0, 255, 128]} // => Isoband for threshold range [6, 10)
];

// Get direction based on start and end location, this function is not needed anymore.
// function getDirection(lon1, lat1, lon2, lat2) {
//   var toRadians = function(v) { return v * Math.PI / 180; };
//   var toDegrees = function(v) { return v * 180 / Math.PI; };
//   var angleRadians = Math.atan2(lat2 - lat1, lon2 - lon1);
//   var angleDegree = toDegrees(angleRadians)
//   return angleDegree
// }

// Sleep function for waiting data transferring.
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// load directories in the historical folder
function loadHistories(my_url) {
  var result = [];
  $.ajax({
    url: my_url,
    type: 'get',
    dataType: 'html',
    async: false,
    success: function(data) {
      if (data !== null) {
        result = parseDirectoryListing(data);
      }
    },
    error: function() {
      console.log('error loading history');
    }
  });
  return result;
}

function parseDirectoryListing(text)
{
  if (text === null) {
    return [];
  }
  let docs = text
      //.match(/href="([\w-]+)/g) // pull out the hrefs
      .match(/href="([^"]+)\.json/g)
      .map((x) => {
        x = x.replace('href="', '')
          .replace('"', '')
          .replace(/^([^.]+)(\..*)/, '$1')
          .split('/');
        return x[x.length - 1];
      }); // clean up

  return docs;
}

class App extends Component{
  constructor(props) {
    super(props);

    this.state = {
      plotdata: { // plotdata is for debugging
        hour:[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
        counts:[1286, 1307, 1264, 1243, 1365, 1346, 1402, 290, 273, 310, 326, 320, 298, 306, 293, 294, 306, 310, 260, 482, 451, 417, 439, 411],
        arrived:[0, 0, 0, 0, 0, 5, 6, 7, 8, 9, 10, 11, 12, 12, 12, 12, 16, 17, 18, 19, 20, 20, 22, 23],
        total:[1286, 1307, 1307, 1307, 1365, 1365, 1402, 1402, 1402, 1402, 1402, 1402, 1402, 1402, 1402, 1402, 1402, 1402, 1402, 1402, 1402, 1402, 1402, 1402],
      },
      plotdata2: {
        ticks:[0],
        counts:[0],
        arrived:[0],
        totals:[0]
      },
      theme: "auto",
      connected: false, // whether or not connect to the server
      synchronized: false, // false: asynchronized mode, loading data from the file directories, true: loading data directly from returned messages
      loaded: false, // whether or not history is loaded
      data_url: null,
      prefix: null,
      prefix2: null,
      dialog: false,
      messages: [], // messages (errors, success, etc)
      arrived: 0, // number of arrived vehicles
      total: 0, // number of generated vehicles
      vehicles: new Map(),
      roads: linkdict,
      shelters: shelterdict,
      shelters_agg: {
        occupancy: 0,
        capacity: 0
      },
      vehicles1: [], // for rendering the layer
      vehicles2: [], // for rendering the layer
      traveltime: [-1,-1,-1,-1,-1,81.17,-1,71.17,58.065,-1,68.78,71.91,77.63,-1,-1,58.795,61.4075,-1,42.24,66.2225,63.167500000000004,45.89,-1,35.7425,83.765,-1,25.475,46.82,-1,164.015,-1,4.26,-1,-1,182.29250000000002,-1,152.35,-1,23.725,-1,23.555,-1,-1,-1,82.2225,215.525,-1,-1,-1,97.6875,-1,154.895,134.81833333333336,-1,-1,116.6,359.2075,152.76,710.42,-1,-1,-1,119.245,-1,-1,58.2775,-1,206.55,-1,26.981666666666666,-1,-1,-1,-1,-1,-1,-1,-1,23.228333333333335,-1,73.33,-1,80.89,31.52,75.745,-1,-1,176.40666666666667,76.895,124.44375,71.37,80.56,74.0475,119.17,485.385,150.595,193.57999999999998,598.245,-1,-1,-1,108.38,79.09,156.9075,172.965,-1,-1,174.0075,-1,156.52,135.665,-1,15.926666666666668,21.4825,23.965,-1,-1,8.07,51.177499999999995,-1,160.265,129.11399999999998,-1,-1,-1,148.545,180.94,-1,134.4,-1,122.07750000000001,-1,123.8825,219.245,129.46499999999997,93.69,183.9875,318.31,-1,29.935,-1,-1,-1,-1,14.26,-1,-1,101.735,134.005,-1,162.275,-1,209.4,-1,95.485,218.22,108.775,-1,-1,16.095,-1,-1,48.96,38.14,18.7,-1,50.72333333333333,-1,-1,26.395,10.831666666666669,17.755,-1,-1,-1,90.33,-1,-1,-1,59.53,-1,109.3775,-1,-1,-1,-1,40.06166666666667,37.2,-1,20.7725,79.955,-1,-1,137.30454545454543,187.045,-1,-1,-1,-1,-1,-1,-1,40.8325,132.0625,33.571250000000006,99.10499999999999,62.602500000000006,70.055,139.8,197.64749999999998,-1,40.31,-1,-1,171.715,44.025,-1,122.6875,234.99,194.275,-1,227.16,146.67,21.235,41.9,-1,23.96,-1,-1,109.0865,-1,-1,54.505,87.515,347.6625,-1,222.8775,46.225,-1,33.23,160.36,-1,105.30333333333333,-1,-1,-1,-1,174.305,137.17,-1,259.23249999999996,-1,-1,75.71,-1,-1,477.625,258.1,357.55,237.545,151.86,107.175,204.15,157.67,68.37,-1,79.545,-1,142.585,-1,553.2460000000004,-1,614.7091696113074,618.242598425197,-1,-1,-1,-1,-1,-1,-1,-1,-1,184.9875,385.46166666666664,-1,-1,284.0675,290.0933333333333,176.49,-1,41.025,41.6325,73.54,-1,30.95,84.0,132.77423076923077,142.59,92.64,185.1875,213.885,312.405,116.655,346.9683333333333,40.625,175.29,66.8775,73.11,74.705,-1,-1,174.865,296.39,855.935,-1,196.145,-1,-1,-1,-1,352.61,-1,-1,-1,15.5,-1,-1,-1,-1,-1,-1,-1,577.4405178571425,-1,-1,410.9875,-1,60.6,49.395,133.08,-1,31.465,34.5,-1,144.6925,119.75,169.42166666666668,-1,178.615,107.215,127.325,-1,-1,-1,-1,-1,-1,-1,268.255,76.025,-1,-1,117.91000000000001,115.28166666666665,10.5275,-1,-1,141.3221153846154,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,141.46541666666667,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,35.085,-1,61.245,33.38,39.26,-1,34.25,-1,-1,-1,47.14,-1,-1,53.099999999999994,-1,-1,27.58,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,122.74000000000001,158.57,-1,-1,43.56,50.66166666666667,60.26700000000001,64.21833333333333,30.778333333333336,29.465,-1,-1,50.72,-1,110.645,61.01,103.965,40.0725,-1,-1,-1,-1,-1,245.27512987012975,-1,-1,363.50286163522014,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,318.1710810810811,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,382.0893895348837,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,119.68041666666666,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,609.4437030075189,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,245.7625287356322,-1,-1,427.23496078431367,-1,-1,-1,-1,569.7889419795221,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,38.645,81.815,83.38,204.85750000000002,-1,17.31,-1,-1,22.945,18.44,-1,16.3475,-1,591.4468596491229,-1,82.385,119.855,164.025,-1,18.0825,-1,-1,-1,-1,16.005,-1,26.38,618.1889626556016,-1,-1,-1,-1,-1,-1,594.6104561403508,-1,632.3188395904435,-1,-1,-1,-1,120.62,89.51,101.855,-1,50.57,39.565,32.985,-1,-1,84.815,-1,31.895,115.155,45.275,60.045,13.49,26.281666666666666,29.355000000000004,35.32833333333333,217.44,-1,140.98,160.07,105.12,104.095,38.97,400.12,100.84,-1,133.74,33.41,106.835,172.72,137.125,-1,-1,-1,45.445,25.31,31.375,58.495000000000005,83.50750000000001,50.09,111.53,139.715,-1,-1,-1,-1,-1,116.335,95.115,75.97,138.32,68.295,-1,162.745,324.035,291.435,198.855,182.34,-1,-1,-1,151.39,235.755,82.51,42.2,-1,9.981666666666667,-1,14.675,92.07833333333333,78.75999999999999,63.445,106.3025,225.705,-1,295.21166666666664,-1,-1,13.345,38.458333333333336,35.665,166.55,44.29,44.12,-1,37.53,-1,-1,37.135,61.902499999999996,36.81,25.98,-1,-1,-1,68.6375,53.165,83.725,79.63000000000001,97.90833333333335,-1,-1,-1,206.965,94.685,-1,32.25,153.71249999999998,62.1775,-1,-1,130.52249999999998,101.53,-1,12.86,-1,-1,-1,-1,-1,-1,181.06,250.835,86.33,95.175,164.86,107.2575,101.38,197.50333333333333,-1,-1,140.895,101.4025,167.99833333333333,-1],
      avgspeed: 0, // average speed by vehicle
      data_address: null,
      maximal_time: 3e6, //maximal ticks
      options: {
        name: "",
        demand: {
          options: []
        },
        routing: {
          options: []
        },
        event: {
          options: []
        },
        ticks: {
          minimum: 1,
          maximum: 10,
          step: 1,
          default: 10
        },
      }, //options for client side control
      settings: Object.keys(TRIPS_CONTROLS).reduce(
        (accu, key) => ({
          ...accu,
          [key]: TRIPS_CONTROLS[key].value
        }),
        {}
      )
    };
    this._onViewStateChange = this._onViewStateChange.bind(this);
    this._onSelectVehicle = this._onSelectVehicle.bind(this);
    this._onSelectLink = this._onSelectLink.bind(this);
    this._onHoverVehicle = this._onHoverVehicle.bind(this);
    this._onHoverLink = this._onHoverLink.bind(this);
    this._onHoverShelter = this._onHoverShelter.bind(this);
    this._onSelectEventLink = this._onSelectEventLink.bind(this);
    this._renderTooltip = this._renderTooltip.bind(this);
    this._renderTooltip2 = this._renderTooltip2.bind(this);
    this._renderTooltip3 = this._renderTooltip3.bind(this);
    this.connectServer = this.connectServer.bind(this);
    this.loadHistory = this.loadHistory.bind(this);
    this.loadNow = this.loadNow.bind(this);
    this.updateTheme = this.updateTheme.bind(this);
    this.updateConfigOptions = this.updateConfigOptions.bind(this);
    this.disConnectServer = this.disConnectServer.bind(this);
    this.synchronizeController = this.synchronizeController.bind(this);
    this.releaseController = this.releaseController.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.upDateMaximalTime = this.upDateMaximalTime.bind(this);
    this.resetCurrentTime = this.resetCurrentTime.bind(this);
  }

  current_time = 0; // Visualization_time
  last_time = this.current_time; // Update_time
  timer = null;
  time_step = 40; // Ticks per file
  jump_step = 6000; // Ticks per jump
  buffer_time = 20; // Buffer_time for loading new data
  fail_count = 0; // Numbers of fails, if there are over 5 fails, restart the visualization, otherwise wait.
  currentFrame = null;
  framesPerTick = 60; //The maximum frame per tick

  // When open the webpage
  componentDidMount() {
    //this.restartAnimation();
    this.setState({
      connectServer: this.connectServer,
      loadHistory: this.loadHistory,
      loadNow: this.loadNow,
      updateConfigOptions: this.updateConfigOptions,
      disConnectServer: this.disConnectServer ,
      synchronizeController: this.synchronizeController ,
      releaseController: this.releaseController ,
      sendMessage:this.sendMessage,
      upDateMaximalTime: this.upDateMaximalTime,
      resetCurrentTime: this.resetCurrentTime
    });

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.setState({theme: "dark"});
    }

    document.querySelector('.app-status').classList.remove('d-none');

    let loaded = 0;
    const that = this;

    import('../res/road.json')
      .then(data => {
        for (var i = 0; i<data['features'].length; i++) {
          linkdict.set(data['features'][i]['properties']['Id'],{speed:13.508, count:0});
        }
        linklist = data;

        loaded++;

        if (loaded == 3) {
          document.querySelector('.app-status').classList.add('d-none');
        }
      })
      .catch(error => error.code + ': An error occurred while loading the component');

    import('../res/shelters.json')
      .then(function(data) {
        // shelteropenData = data.features.filter(d => { return d.properties.CapReporte < d.properties.CapPersons; });
        // shelterfullData = data.features.filter(d => { return d.properties.CapReporte >= d.properties.CapPersons; });
        // let occupants = 0;
        let capacit = 0;
        for (var i = 0; i<data['features'].length; i++) {
          capacit += parseInt(data['features'][i].properties.DummyCap);
          shelterlist.push(data['features'][i])
          shelterdict.set(data['features'][i]['properties']['Id'], {occupancy: 0, capacity:
                parseInt(data['features'][i]['properties']['DummyCap'])})
        }

        // console.log(shelterlist);

        // console.log(shelterdict)
        // console.log(capacit)

        // for (var i = 0; i<data['features'].length; i++) {
        //   if (!isNaN(data['features'][i].properties.CapReporte)) {
        //     occupants += parseInt(data['features'][i].properties.CapReporte);
        //   }
        //   if (!isNaN(data['features'][i].properties.CapPersons)) {
        //     capacit += parseInt(data['features'][i].properties.CapPersons);
        //   }
        //
        //   if (data['features'][i].properties.CapReporte < data['features'][i].properties.CapPersons) {
        //     shelteropenData.push(data['features'][i]);
        //   } else {
        //     shelterfullData.push(data['features'][i]);
        //   }
        // }

        that.setState({shelters_agg: {occupancy: 0, capacity: capacit}, shelters: shelterdict}).then(()=>{
          console.log(this.state.shelters_agg);
        });

        loaded++;

        if (loaded == 3) {
          document.querySelector('.app-status').classList.add('d-none');
        }
      })
      .catch(error => error.code + ': An error occurred while loading the component');

    import('../res/cbgs_centroid.json').then(function(data) {
      for (var i = 0; i < data['features'].length; i++){
        zonelist.push(data['features'][i])
      }
      loaded++;

      if (loaded == 3) {
        document.querySelector('.app-status').classList.add('d-none');
      }
    }).catch()
  }

  // Client control
  connectServer() {
    const addr = "ws://" + document.getElementsByName("addr_txt")[0].value;
    console.log("Connecting to (" + addr + ")...");

    // Create the connection
    ws = new WebSocket(addr);
    //console.log(ws);
    if (ws != null) {
      const that = this;
      const loadNow = this.loadNow;
      const updateConfigOptions = this.updateConfigOptions;
      const upDateMaximalTime  = this.upDateMaximalTime;
      const updateCurrentTick = this.updateCurrentTick;

      // Connection established
      //that.setState({connected: true});

      ws.addEventListener('error', function() {
        that.setState({connected: false});
        that.setState({messages: [...that.state.messages, {
          id: Math.floor((Math.random() * 101) + 1),
          title: 'Error',
          description: 'Failed to connect.',
          type: 'danger'
        }]});
      });

      ws.addEventListener('close', function(e) {
        let reason = '';

        // See http://tools.ietf.org/html/rfc6455#section-7.4.1
        if (e.code == 1000) {
          reason = 'Normal closure, meaning that the purpose for which the connection was established has been fulfilled.';
          return;
        }

        if (e.code == 1001) {
            reason = 'An endpoint is "going away", such as a server going down or a browser having navigated away from a page.';
        } else if (e.code == 1002) {
            reason = 'An endpoint is terminating the connection due to a protocol error';
        } else if (event.code == 1003) {
            reason = 'An endpoint is terminating the connection because it has received a type of data it cannot accept (e.g., an endpoint that understands only text data MAY send this if it receives a binary message).';
        } else if (event.code == 1004) {
            reason = 'Reserved. The specific meaning might be defined in the future.';
        } else if (event.code == 1005) {
            reason = 'No status code was actually present.';
        } else if (event.code == 1006) {
            reason = 'The connection was closed abnormally (e.g., without sending or receiving a Close control frame).';
        } else if (event.code == 1007) {
            reason = 'An endpoint is terminating the connection because it has received data within a message that was not consistent with the type of the message (e.g., non-UTF-8 [http://tools.ietf.org/html/rfc3629] data within a text message).';
        } else if (event.code == 1008) {
            reason = 'An endpoint is terminating the connection because it has received a message that "violates its policy". This reason is given either if there is no other sutible reason, or if there is a need to hide specific details about the policy.';
        } else if (event.code == 1009) {
            reason = 'An endpoint is terminating the connection because it has received a message that is too big for it to process.';
        } else if (event.code == 1010) { // Note that this status code is not used by the server, because it can fail the WebSocket handshake instead.
            reason = 'An endpoint (client) is terminating the connection because it has expected the server to negotiate one or more extension, but the server didn\'t return them in the response message of the WebSocket handshake. <br /> Specifically, the extensions that are needed are: ' + event.reason;
        } else if (event.code == 1011) {
            reason = 'A server is terminating the connection because it encountered an unexpected condition that prevented it from fulfilling the request.';
        } else if (event.code == 1015) {
            reason = 'The connection was closed due to a failure to perform a TLS handshake (e.g., the server certificate can\'t be verified).';
        }

        that.setState({connected: false});
        that.setState({messages: [...that.state.messages, {
          id: Math.floor((Math.random() * 101) + 1),
          title: 'Error',
          description: 'Connection closed' + (reason ? ': ' + reason : ''),
          type: 'danger'
        }]});
      });

      ws.addEventListener('open', function() {
        that.setState({connected: true});
        that.setState({messages: [...that.state.messages, {
          id: Math.floor((Math.random() * 101) + 1),
          title: 'Success',
          description: 'Successfully connected',
          type: 'success'
        }]});
      });

      ws.addEventListener('message', function(evt) {
        let evt_lines = evt.data.split('\n');
        let evt_type = evt_lines[0];
        let evt_msg = evt_lines.splice(1).join('\n');

        if (evt_type == 'STATUS') {
          // stat_msg_count++;
          // update the last received status box
          // upDateMaximalTime(evt_msg)
          console.log(evt_msg);
          let current_tick = JSON.parse(evt_msg);
          document.getElementsByName("max_time")[0].value = (current_tick['ticks']*0.3).toFixed(0);
          upDateMaximalTime();
        }
        else if (evt_type == 'ERROR') {
          //err_msg_count++;

          // prepend a token to each line to signify these are error lines
          evt_lines = evt.data.split('\n');
          for (var i=0; i < evt_lines.length; i++) {
            evt_lines[i] = "[ERR] " + evt_lines[i];
          }
          let err_msg = evt_lines.splice(1).join('\n');

          // append contents to the error log and scroll to bottom
          console.log(err_msg);
        }
        else if (evt_type == 'LOCATION') {
          // we have been sent a new URL for accessing the output files
          let url = evt.data.split('\n')[1];
          console.log(url);
          loadNow(url);
        }
        else if (evt_type == 'OPTIONS') {
          // we have been sent a description of all possible config values
          try {
            // attempt to parse the given json string into an object
            let options = JSON.parse(evt_msg);

            // update the dialog box with the new possible config options
            updateConfigOptions(options);

            // // place a copy of the json object on the page for debug reference
            // var optionsString = JSON.stringify(options, null, 2);
            // document.getElementsByName("config_json")[0].innerHTML = optionsString;
          }
          catch (e) {
            // something is wrong with the conf object parsing
            console.log("Something goes wrong when reading options.");
          }
        }
        else if (evt_type == 'DATA') {
          try {
            let record = JSON.parse(evt_msg);
            updateCurrentTick(record);
          }
          catch (e) {
            // something is wrong with the conf object parsing
            console.log("Something goes wrong when loading current tick.");
          }
        }
        else {
          // handle an unknown message type, display it
          console.log(evt);
        }
      });
    }
    else {
      this.setState({messages: [...this.state.messages, {
        id: Math.floor((Math.random() * 101) + 1),
        title: 'Error',
        description: 'Failed to connect',
        type: 'error'
      }]});
      console.log("Connection failed");
    }
  }
  // Diconnect the server
  disConnectServer() {
    if (ws != null) {
      ws.close();
      ws = null;
    }
    this.setState({connected: false, synchronized: false})
    console.log("connection closed");
    this.setState({messages: [...this.state.messages, {
      id: Math.floor((Math.random() * 101) + 1),
      title: 'Closed',
      description: 'Connection closed',
      type: 'info'
    }]});
  }

  // Enter the synchronized mode, when using synchronized mode, visualize the real-time using websocket
  synchronizeController() {
    if (ws != null) {
      this.setState({synchronized: true});
      if (this.timer) {
        this.timer.stop();
      }
    }
    console.log("synchronized to instance");
  }

  // Quit synchronized mode
  releaseController() {
    if (ws != null) {
      this.setState({synchronized: false})
    }
    this.restartAnimation();
    console.log("desynchronized to instance");
  }

  // Send text message through websocket
  sendMessage() {
    if (ws !=null) {
      const msg = document.getElementsByName("send_txt")[0].value;
      ws.send(msg);
      console.log("Message being sent")
    }
  }

  // Load maximal time returned from the server
  upDateMaximalTime() {
      const max_time = document.getElementsByName("max_time")[0].value;
      this.setState({maximal_time: max_time}, ()=>
          console.log("Current max time tick is", max_time));
  }

  // Visualization control
  loadHistory() {
    let dir = document.getElementsByName("hist_txt")[0].value;
    //console.log(dir);
    let file_names = loadHistories(dir);

    if (file_names.length) {
      this.setState({loaded: true});
      this.setState({messages: [...this.state.messages, {
        id: Math.floor((Math.random() * 101) + 1),
        title: 'Success',
        description: 'Successfully loaded directory',
        type: 'success'
      }]});

      let prefix = null;
      let prefix2 = null;

      console.log(file_names);
      for(const file_name of file_names){
        if(file_name.includes("snapshot")){
          prefix = file_name;
          break;
        }
      }
      for(const file_name of file_names){
        if(file_name.includes("vehicle-list")){
          prefix2 = file_name.substring(0, file_name.length-1);
          break;
        }
      }

      sleep(1000).then(()=>{
        this.setState({data_url: dir, prefix:prefix, prefix2:prefix2}, ()=>
            this.resetCurrentTime())
      });
    } else {
      this.setState({messages: [...this.state.messages, {
        id: Math.floor((Math.random() * 101) + 1),
        title: 'Error',
        description: 'Failed to load history',
        type: 'danger'
      }]});
    }
  }

  // Called after sending "start" message to the server
  loadNow(dir) {
    //console.log(dir);
    sleep(20000).then(()=>{
      let file_names = loadHistories(dir+'/instance_0/');
      sleep(10000).then(()=>{
        console.log(file_names);
        this.setState({data_url: dir+'/instance_0', prefix: file_names[0]}, ()=> this.resetCurrentTime())
      })
    });
  }

  //  For controls.js
  updateTheme(value) {
    this.setState({theme:value},()=>console.log(this.state.theme))
  }

  //  For controls.js
  updateConfigOptions(options) {
    this.setState({options:options},()=>console.log(this.state.options))
  }

  // Load Data from websocket
  updateCurrentTick(record) {
    this.setState({currentData:record},()=>console.log(this.state.currentData))
  }

  resetCurrentTime() {
    let new_time =  (Math.min(parseFloat(document.getElementsByName("new_time")[0].value), this.state.maximal_time)/0.3/this.time_step).toFixed(0)*this.time_step;
    console.log(new_time)
    this.current_time = (new_time/this.jump_step).toFixed(0) * this.jump_step;
    this.last_time = this.current_time; // Update_time
    this.last_time = this.current_time; // Update_time
    this.timer = null;
    this.currentFrame = null;
    this.setState({plotdata2:{ticks:[], counts:[], arrived:[], totals:[]}}, ()=>this.restartAnimation());
  }

  // Core functions for visualizing trajectories
  // Change the data processing here
  restartAnimation() {
    if (this.timer) {
      this.timer.stop();
    }
    // Load the initial location data
    if(this.last_time>0){
      let vehicles = new Map();
      let total = 0;
      console.log(this.state.prefix2);
      d3.json(this.state.data_url+"/"+this.state.prefix2+(this.last_time/this.jump_step+1)+".json").then(
          (new_data) => {
            Object.keys(new_data).forEach((key) => {
              let fields = new_data[key].split(',');
              console.log(fields);
              console.log(key);
              vehicles.set(Number(key), {startID: Number(fields[0]),
                endID: Number(fields[1]),
                x1: Number(fields[2]),
                x2: Number(fields[2]),
                y1: Number(fields[3]),
                y2: Number(fields[3]),
                speed: 0,
                bearing: 0});
              total+=1;
            });
            this.setState({vehicles:vehicles, total:total},()=>{
              // Load the vehicle trajectory data
              d3.json(this.state.data_url+"/"+this.state.prefix+"."+(this.last_time/this.time_step+1)+".json")
                  .then(
                      (new_data) => this.setState({subdata: new_data, subswitch: 0, data: []},
                          () => {
                            this.fetchData(this.last_time+this.time_step);
                          }
                      ))
                  .catch(() => {
                    this.setState({messages: [...this.state.messages, {
                        id: Math.floor((Math.random() * 101) + 1),
                        title: 'Error',
                        description: 'Failed to load JSON file: ' + this.state.data_url+"/"+this.state.prefix+"."+((this.last_time)/40+1)+".json",
                        type: 'danger'
                      }]});
                  });
            });
          }
      )
    }
    else{
      // Load the vehicle trajectory data
      d3.json(this.state.data_url+"/"+this.state.prefix+"."+(this.last_time/this.time_step+1)+".json")
          .then(
              (new_data) => this.setState({subdata: new_data, subswitch: 0, data: []},
                  () => {
                    this.fetchData(this.last_time+this.time_step);
                  }
              ))
          .catch(() => {
            this.setState({messages: [...this.state.messages, {
                id: Math.floor((Math.random() * 101) + 1),
                title: 'Error',
                description: 'Failed to load JSON file: ' + this.state.data_url+"/"+this.state.prefix+"."+((this.last_time)/40+1)+".json",
                type: 'danger'
              }]});
          });
    }
  }

  //'vehicleID', 'startx', 'starty','endx','endy', 'speed', 'originx','originy','destx','desty', 'nearlyArrived', 'type'
  //'vehicleClass', 'roadID'\
  // new data processing code here.
  fetchData=(current_time) => {
    this.setState({data: this.state.subdata}, () => {
      this.last_time += this.time_step;
      // Alert or stop when time tick arrive
      if (this.last_time > this.state.maximal_time) {
        //Alert the user here.
        console.log("Boundary reached");
        if (this.timer) {
          this.timer.stop();
        }
      }
      this.startAnimation();
      // LZ: new data processing code here
      d3.json(this.state.data_url+"/"+this.state.prefix+"."+((current_time)/40+1)+".json")
        .then(
          (new_data) => this.setState({subdata: new_data}))
        .catch(
          () => {
            this.setState({messages: [...this.state.messages, {
              id: Math.floor((Math.random() * 101) + 1),
              title: 'Error',
              description: 'Failed to load  JSON file: ' + this.state.data_url+"/"+this.state.prefix+"."+((current_time)/40+1)+".json",
              type: 'danger'
            }]});
        });
    });
  }

  succeed = true;

  // Process the data per 20 ticks
  processData = async (tick) => {
    // console.log("Processing data");
    // console.log(tick);
    let {vehicles, roads, shelters, shelters_agg, arrived, total} = this.state;
    let total_v = 0; // For calculating avg speed
    if(this.state.data[tick]){
      // Update vehicle data, features include: startID, endID, segment[x1, y1, x2, y2], bearing
      this.state.data[tick].newVehs.forEach((newVeh)=>{
        let fields = newVeh.split(',');
        vehicles.set(Number(fields[0]), {startID: Number(fields[1]),
          endID: Number(fields[2]),
          x1: 0,
          x2: 0,
          y1: 0,
          y2: 0,
          speed: 0,
          bearing: 0});
        total+=1;
      });

      vehicles.forEach((v) =>{
        // Rolling the (x2,y2) to (x1,y1)
        v.x1 = v.x2;
        v.y1 = v.y2;
        v.speed = 0;
      });

      this.state.data[tick].vehicles.forEach((veh)=>{
        let fields = veh.split(',');
        let v = vehicles.get(Number(fields[0]));
        if(v){
          // Update x2, y2
          v.x2 = Number(fields[1]);
          v.y2 = Number(fields[2]);
          v.speed = Number(fields[3]);
          v.bearing = Number(fields[4]);
          total_v += Number(fields[3]);
        }
        else{
          // Set x2, y2
          vehicles.set(Number(fields[0]), {
            startID: 0,
            endID: 0,
            x1: Number(fields[1]),
            x2: Number(fields[1]),
            y1: Number(fields[2]),
            y2: Number(fields[2]),
            speed: Number(fields[3]),
            bearing: Number(fields[4])});
          total_v += Number(fields[3]);
        }
      });

      // Update road data, features include: ID, num_vehicle, speed
      this.state.data[tick].roads.forEach((road)=>{
        let fields = road.split(',');
        let r = roads.get(Number(fields[0]));
        r.count = Number(fields[1]);
        r.speed = Number(fields[2]);
      });
      // Update shelter data, do not need to consider right now
      this.state.data[tick].shelters.forEach((shelter)=>{
        let fields = shelter.split(',');
        let s = shelters.get(-Number(fields[0]));
        let old_occupancy = s.occupancy;
        s.occupancy = Number(fields[1]);
        shelters_agg.occupancy += Number(fields[1]) - old_occupancy;
      })

      // Updated the numOfArrived vehicles
      this.state.data[tick].arrVehs.forEach((arrVeh)=>{
        vehicles.delete(Number(arrVeh));
        arrived += 1;
      });
    }

    // create the data for vehicle layer
    this.fail_count = 0; // refresh the fail count
    this.state.roads = roads;
    this.state.shelters = shelters;
    this.state.shelters_agg = shelters_agg;
    this.state.total = total;
    this.state.arrived = arrived;
    this.state.vehicles = vehicles;
    this.state.avgspeed = total_v/(vehicles.size+1e-6);
    if (this.state.subswitch) {
      this.state.subswitch = 1 - this.state.subswitch
      this.state.vehicles2 =
            Array.from(vehicles).map(([key, value]) => ({
              id: key,
              lon: value.x1,
              lat: value.y1,
              speed: value.speed,
              bearing: value.bearing,
              origin: value.startID,
              destination: value.endID,
              interpolatePos: d3.geoInterpolate([value.x1, value.y1],
                  [value.x2, value.y2])
            }));
      // if (this.state.vehicles2 == null) {
      //   this.state.vehicles2 = [];
      // }
    } else {
      this.state.subswitch = 1 - this.state.subswitch
      this.state.vehicles1 =
          Array.from(vehicles).map(([key, value]) => ({
            id: key,
            lon: value.x1,
            lat: value.y1,
            speed: value.speed,
            bearing: value.bearing,
            origin: value.startID,
            destination: value.endID,
            interpolatePos: d3.geoInterpolate([value.x1, value.y1],
                [value.x2, value.y2])
          }));
      // if (this.state.vehicles1 == null) {
      //   this.state.vehicles1 = [];
      // }
    }
    this.state.plotdata2.ticks.push(this.current_time);
    this.state.plotdata2.counts.push(vehicles.size);
    this.state.plotdata2.totals.push(total);
    this.state.plotdata2.arrived.push(arrived);
    this.succeed = true;
    this.current_time += this.buffer_time;
    // With new data structure, the following operations can be saved
    // Calculate link speed
    // Create special layer for selected vehicle
    // Calculate vehicle location
  }

  // Vehicle location, use intercept to reduce the network load
  startAnimation = () => {
    if (this.current_time >= (this.last_time)) {
      console.log("Piece 1 take care of this update.");
      this.fetchData(this.last_time+this.time_step);
    }
    else {
      console.log((this.current_time+this.buffer_time));
      if (this.state.data[(this.current_time+this.buffer_time)] && this.succeed) {
        this.succeed = false;
        // process data
        this.processData(this.current_time+this.buffer_time).then(()=>{
          // start the animation
          this.currentFrame = 0;
          this.timer = d3.timer(this.animationFrame);
        });
      }
      else {
        // The internet speed does not support this visualization speed, let's make the speed lower and reload the visualization
        this.fail_count+=1
        console.log("Piece 2 take care of this update.");
        if (this.fail_count>5) {
          this.fail_count=0;
          this.restartAnimation(); // Fail to load data, skip the current tick
        }
      }
    }
  }
  // animated the prepared layer
  animationFrame = () => {
    if (this.currentFrame>=(this.framesPerTick-this.state.settings.speed)) {
      if (this.timer) {
        this.timer.stop();
        this.startAnimation();
      }
    }
    else {
      if (this.state.subswitch) {
        let {vehicles1} = this.state;
        if(vehicles1.length>0){
          vehicles1 = vehicles1.map(d => {
            const [lon, lat] = d.interpolatePos(this.currentFrame / (this.framesPerTick-this.state.settings.speed));
            return {
              ...d,
              lon,
              lat
            };
          });
        }
        if (this.state.settings.play) {
          this.setState({vehicles1: vehicles1},()=>{
            this.currentFrame+=1;
          });
        }
      }
      else{
        let {vehicles2} = this.state;
        if(vehicles2.length>0){
          vehicles2 = vehicles2.map(d => {
            const [lon, lat] = d.interpolatePos(this.currentFrame / (this.framesPerTick-this.state.settings.speed));
            return {
              ...d,
              lon,
              lat
            };
          });
        }
        if (this.state.settings.play) {
          this.setState({vehicles2: vehicles2},()=> {
            this.currentFrame += 1;
          });
        }
      }
    }
  }

  _onViewStateChange({viewState}) {
    this.setState({viewState});
  }

  _updateLayerSettings(settings) {
    this.setState({ settings });
  }

  _onSelectVehicle({object}) {
    console.log('Selected');
    console.log(object);
    console.log(zonelist[object.origin].geometry.coordinates);
    console.log(zonelist[object.destination].geometry.coordinates);
    this.setState({selected_vehicle:object});
    /*this.setState({selected_vehicle:{id:object.id,
        originx:object.originx,
        originy:object.originy,
        destx: object.destx,
        desty: object.desty}});*/
  }

  _onHoverVehicle({x, y, object}) {
    this.setState({x, y, hovered_object: object});
  }

  _onSelectLink({object}) {
    this.setState({selected_link: object.properties});
  }

  _onHoverLink({x, y, object}) {
    this.setState({x2:x, y2:y, hovered_link: object});
  }

  _onSelectEventLink({object}) {
    document.getElementsByName("select_link")[0].value = object.properties.Id;
  }

  _onHoverEventLink({x, y, object}) {
    this.setState({x2:x, y2:y, hovered_link: object});
  }

  _onHoverShelter({x, y, object}) {
    this.setState({x3: x, y3: y, hovered_shelter: object})
  }

  // Tooltip for vehicles
  _renderTooltip() {
    const {x, y, hovered_object} = this.state;
    return (
        // if hoveredObject is null, then the rest part won't be execute
        hovered_object && (
            <div className="tooltipp" style={{top: y, left: x}}>
              <div> Vehicle id: {hovered_object.id} </div>
              <div> Speed: {(hovered_object.speed* 2.2374).toFixed(2)} mph</div>
            </div>
        )
    );
  }

  // Tooltip for roads
  _renderTooltip2() {
    const { x2, y2, hovered_link, roads} = this.state;
    return (
        // if hoveredObject is null, then the rest part won't be execute
        hovered_link && (
            <div className="tooltipp" style={{top: y2, left: x2}}>
              <div> Link id: {hovered_link.properties.Id} </div>
              <div> Average Speed: {(roads.get(hovered_link.properties.Id).speed *2.2374).toFixed(2)} mph</div>
            </div>
        )
    );
  }

  // Tooltip for shelters
  _renderTooltip3() {
    const { x3, y3, hovered_shelter, shelters} = this.state;
    return (
        hovered_shelter && (
            <div className="tooltipp" style={{top: y3, left: x3}}>
              <div> Shelter id: {hovered_shelter.properties.Id} </div>
              <div> Capacity: {shelters.get(hovered_shelter.properties.Id).capacity}</div>
              <div> Occupancy: {shelters.get(hovered_shelter.properties.Id).occupancy}</div>
            </div>
        )
    )
  }

  switchTab(e) {
    let links = document.querySelectorAll('.nav-link');

    links.forEach(el => {
      el.classList.remove('active');
      document.getElementById(el.getAttribute('href').replace('#', '')).classList.remove('active');
    });

    //let el = e.target;
    e.classList.add('active');
    document.getElementById(e.getAttribute('href').replace('#', '')).classList.add('active');
  }

  render() {
    // console.log(this.state.traveltime)
    // console.log(linklist)
    let layers = [];
    if (!this.state.synchronized) {
      if (this.state.settings.style==1) {
        layers.push([
          new HeatmapLayer({
            id: 'heatmap-vehicles',
            data: this.state.vehicles1,
            visible: this.state.subswitch,
            pickable: false,
            getPosition: d => [d.lon, d.lat],
            getWeight: 1,
            radiusPixels: 20,
            intensity: 2,
            threshold: 0.1
          }),
          new HeatmapLayer({
            id: 'heatmap-vehicles2',
            data: this.state.vehicles2,
            visible: 1-this.state.subswitch,
            pickable: false,
            getPosition: d => [d.lon, d.lat],
            getWeight: 1,
            radiusPixels: 20,
            intensity: 2,
            threshold: 0.1
          })
        ]);
      } else {
        layers.push([
          new IconLayer({
            id: 'scatterplot-vehicles',
            data: this.state.vehicles1,
            visible: this.state.subswitch,
            pickable: true,
            onClick: this._onSelectVehicle,
            onHover: this._onHoverVehicle,
            iconAtlas: car2,
            iconMapping:{
              vehicle:{
                x: 0,
                y: 0,
                width: 256,
                height: 256
              }
            },
            sizeScale: 20,
            getPosition: d => [d.lon, d.lat],
            getIcon: () => "vehicle",
            getAngle: d => 360-d.bearing,
          }),
          new IconLayer({
            id: 'scatterplot-vehicles2',
            data: this.state.vehicles2,
            visible: 1-this.state.subswitch,
            pickable: true,
            onClick: this._onSelectVehicle,
            onHover: this._onHoverVehicle,
            iconAtlas: car2,
            iconMapping:{
              vehicle:{
                x: 0,
                y: 0,
                width: 256,
                height: 256
              }
            },
            sizeScale: 20,
            getPosition: d => [d.lon, d.lat],
            getIcon: () => "vehicle",
            getAngle: d => 360-d.bearing,
          }),
          new IconLayer({
            id: 'scatterplot-shelters',
            data: shelterlist,
            //visible: 1,
            pickable: true,
            // iconMapping:{
            //   shelter:{
            //     x: 0,
            //     y: 0,
            //     width: 640,
            //     height: 512,
            //   }
            // },
            onHover: this._onHoverShelter,
            sizeScale: 20,
            getPosition: d => [d.properties.Lon, d.properties.Lat],
            getIcon: d => (this.state.shelters.get(d.properties.Id).capacity > this.state.shelters.get(d.properties.Id).occupancy) ? ({
              url: ShelterOpen,
              width: 640,
              height: 512,
              anchorY: 0
            }): ({
              url: ShelterFull,
              width: 640,
              height: 512,
              anchorY: 0
            }),
            updateTriggers: {
              getIcon: this.current_time,
            }
          }),
          // new IconLayer({
          //   id: 'scatterplot-shelters-full',
          //   data: shelterfullData, //.filter(d => { return d.properties.CapReporte < d.properties.CapPersons; }),
          //   //visible: 1,
          //   pickable: true,
          //   iconAtlas: ShelterFull,
          //   iconMapping:{
          //     shelter:{
          //       x: 0,
          //       y: 0,
          //       width: 640,
          //       height: 512
          //     }
          //   },
          //   sizeScale: 20,
          //   getPosition: d => [d.properties.Lon, d.properties.Lat],
          //   getIcon: () => "shelter"
          // })
        ])
      }
    }

    // Optional layers
    if (this.state.settings.contour) {
      layers.unshift(new ContourLayer({
        id: 'contour-layer',
        data: zonelist,
        contours: CONTOURS,
        aggregation: 'MEAN',
        cellSize: 5000,
        getPosition: d => d.geometry.coordinates,
        getWeight: d => this.state.traveltime[d.properties.ORIG_FID]
      }))
    }

    if (this.state.settings.mode) {
      layers.unshift(new GeoJsonLayer({
        id: 'geojson-link',
        data: linklist,
        opacity: 1,
        lineWidthUnits: 'pixels',
        lineWidthMinPixels: 0,
        lineWidthMaxPixels: 6,
        parameters: {
          depthTest: false
        },
        pickable: true,
        onClick: this._onSelectLink,
        onHover: this._onHoverLink,
        getLineColor: f => COLOR_SCALE(
            (this.state.roads.get(f.properties.Id).speed*2.2374)),
        getLineWidth: () => 200,//(this.state.roadcount.get(f.properties.Id)==0)?0: 200,
        updateTriggers: {
          getLineColor: this.current_time,
          getLineWidth: this.current_time
        }
      }))
    }

    if (this.state.selected_vehicle) {
      layers.push([
        new IconLayer({
          id: 'scatterplot-origin',
          data: [this.state.selected_vehicle],
          iconAtlas: PinOrigin,
          iconMapping:{
            origin_pin:{
              x: 0,
              y: 0,
              width: 288,
              height: 512,
              anchorY: 512
            }
          },
          sizeScale: 50,
          getPosition:  d => zonelist[d.origin-1].geometry.coordinates,
          getIcon: () => "origin_pin",
        }),
        new IconLayer({
          id: 'scatterplot-dest',
          data: [this.state.selected_vehicle],
          iconAtlas: PinDestination,
          iconMapping:{
            dest_pin:{
              x: 0,
              y: 0,
              width: 288,
              height: 512,
              anchorY: 512
            }
          },
          sizeScale: 50,
          getPosition: d => zonelist[d.destination-1].geometry.coordinates,
          getIcon: () => "dest_pin",
        }),
        new IconLayer({
          id: 'scatterplot-vehicle-selected',
          data: this.state.vehicles1.filter(d => { return this.state.selected_vehicle && d.id == this.state.selected_vehicle.id }),
          visible: (this.state.selected_vehicle ? this.state.subswitch : 0),
          pickable: true,
          onClick: this._onSelectVehicle,
          onHover: this._onHoverVehicle,
          iconAtlas: car4,
          iconMapping:{
            vehicle:{
              x: 0,
              y: 0,
              width: 256,
              height: 256
            }
          },
          sizeScale: 20,
          getPosition: d => [d.lon, d.lat],
          getIcon: () => "vehicle",
          getAngle: d => 360-d.bearing,
        }),
        new IconLayer({
          id: 'scatterplot-vehicle-selected2',
          data: this.state.vehicles2.filter(d => { return this.state.selected_vehicle && d.id == this.state.selected_vehicle.id }),
          visible: (this.state.selected_vehicle ? 1-this.state.subswitch : 0),
          pickable: true,
          onClick: this._onSelectVehicle,
          onHover: this._onHoverVehicle,
          iconAtlas: car4,
          iconMapping:{
            vehicle:{
              x: 0,
              y: 0,
              width: 256,
              height: 256
            }
          },
          sizeScale: 20,
          getPosition: d => [d.lon, d.lat],
          getIcon: () => "vehicle",
          getAngle: d => 360-d.bearing,
        })
      ]);
    }
    if (this.state.synchronized) {
      layers.unshift(new GeoJsonLayer({
        id: 'geojson-link2',
        data: linklist,
        opacity: 1,
        lineWidthUnits: 'pixels',
        lineWidthMinPixels: 0,
        lineWidthMaxPixels: 6,
        parameters: {
          depthTest: false
        },
        pickable: true,
        onClick: this._onSelectEventLink,
        onHover: this._onHoverLink,
        getLineColor: () => [200, 200, 200],
        getLineWidth: () => 300,//(this.state.roadcount.get(f.properties.Id)==0)?0: 200
      }))
    }

    document.getElementsByTagName('body')[0].className = this.state.theme;

    let staticMap;
    if (this.state.theme == "dark"){ // || (this.state.theme == "auto" && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      staticMap = <StaticMap mapboxApiAccessToken={MAPBOX_ACCESS_TOKEN} mapStyle="mapbox://styles/mapbox/dark-v9"/>;
    } else {
      staticMap = <StaticMap mapboxApiAccessToken={MAPBOX_ACCESS_TOKEN}/>;
    }

    let className = this.state.loaded ? 'app-body loaded' : 'app-body';

    return(
        <div className={className}>
          <DeckGL
              initialViewState={initialViewState}
              controller={true}
              layers={layers}
              onViewStateChange={this._onViewStateChange}
          >
            {staticMap}
            {this._renderTooltip}
            {this._renderTooltip2}
            {this._renderTooltip3}
          </DeckGL>
          <div className="app-pane app-controls">
            <ul className="nav nav-tabs nav-fill">
              <li className="nav-item">
                <a href="#app-connection" className="nav-link active" onClick={e => this.switchTab(e.target)}>Data</a>
              </li>
              <li className="nav-item">
                <a href="#app-options" className="nav-link" onClick={e => this.switchTab(e.target)}>Options</a>
              </li>
            </ul>
            <div className="tab-content" id="app-tabContent">
              <Client {...this.state} />
              <LayerControls
                title="Options"
                settings={this.state.settings}
                propTypes={TRIPS_CONTROLS}
                onChange={settings => this._updateLayerSettings(settings)}
                currentTime={Math.ceil((this.current_time+ this.buffer_time*this.currentFrame/ (this.framesPerTick-this.state.settings.speed)))}
                resetCurrentTime = {this.resetCurrentTime}
              />
            </div>
              <Interface {...this.state}
                onChange={this.updateTheme}
                />
          </div>
          <Legend {...this.state} />
          <div className="app-pane app-stats">
            <Panel {...this.state} />
          </div>
          <div className="app-pane app-plots">
            <Chart {...this.state}
                   roadData={linklist} />
          </div>
          <div className="app-pane app-status d-none">
            <span className="spinner-border spinner-border-sm" role="status"></span> <span className="app-status-message">Loading data...</span>
          </div>
          <Toast
            toastList={this.state.messages}
            position="top-right"
            autoDelete={true}
            dismissTime={3000}
          />
        </div>
    );
  }
}


export default App;
