import React, {Component, } from 'react';
import DeckGL, {IconLayer, GeoJsonLayer} from 'deck.gl';
import {HeatmapLayer} from '@deck.gl/aggregation-layers';
import {StaticMap} from "react-map-gl";
import * as d3 from "d3";

import {
  LayerControls,
  TRIPS_CONTROLS
} from './controls';
import {Panel} from "./panel";
import {Legend} from "./legend";
import {Client} from "./client"
import {Chart} from "./chart";
import Toast from "./toast";
import {scaleThreshold} from 'd3-scale';

import linkData from '../res/road.json';
import car4 from "../res/car4.png";
import car2 from "../res/car2.png";
import PinOrigin from "!file-loader!../res/pin_red.svg";
import PinDestination from "!file-loader!../res/pin_blue.svg";

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
for(var i = 0; i<linkData['features'].length; i++){
  linkdict.set(linkData['features'][i]['properties']['Id'],0);
}
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


// Get direction based on start and end location.
function getDirection(lon1, lat1, lon2, lat2){
  var toRadians = function(v) { return v * Math.PI / 180; };
  var toDegrees = function(v) { return v * 180 / Math.PI; };
  var angleRadians = Math.atan2(lat2 - lat1, lon2 - lon1);
  var angleDegree = toDegrees(angleRadians)
  return angleDegree
}

// Sleep function for waiting data transferring.
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// load directories in the historical folder
function loadHistories(my_url){
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
    error: function(request, status, error) {
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
          .replace(/^([^\.]+)(\..*)/, '$1')
          .split('/');
        return x[x.length - 1];
      }); // clean up

  return docs;
}

class App extends Component{
  constructor(props){
    super(props);

    this.state = {
      plotdata: {hour:[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
        counts:[1286, 1307, 1264, 1243, 1365, 1346, 1402, 290, 273, 310, 326, 320, 298, 306, 293, 294, 306, 310, 260, 482, 451, 417, 439, 411]},
      plotdata2: {ticks:[0], counts:[0], arrived:[0]},
      arrived: 0,
      connected: false, // whether or not connect to the server
      synchronized: false, // false: asynchronized mode, loading data from the file directories, true: loading data directly from returned messages
      loaded: false, // whether or not history is loaded
      data_url: null,
      prefix: null,
      dialog: false,
      messages: [], // messages (errors, success, etc)
      data: [], //current data
      subdata: [], //new data
      currentdata: [], //data for real time display
      vehicles1: [],
      vehicles2: [],
      roadspeed: new Map(linkdict),
      roadcount: new Map(linkdict),
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
          {})};
    this._onViewStateChange = this._onViewStateChange.bind(this);
    this._onSelectVehicle = this._onSelectVehicle.bind(this);
    this._onSelectLink = this._onSelectLink.bind(this);
    this._onHoverVehicle = this._onHoverVehicle.bind(this);
    this._onHoverLink = this._onHoverLink.bind(this);
    this._onSelectEventLink = this._onSelectEventLink.bind(this);
    this._renderTooltip = this._renderTooltip.bind(this);
    this._renderTooltip2 = this._renderTooltip2.bind(this);
    this.connectServer = this.connectServer.bind(this);
    this.loadHistory = this.loadHistory.bind(this);
    this.loadNow = this.loadNow.bind(this);
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
  buffer_time = 20; // Buffer_time for loading new data
  fail_count = 0; // Numbers of fails, if there are over 5 fails, restart the visualization, otherwise wait.
  currentFrame = null;
  framesPerTick = 60; //The maximum frame per tick

  // When open the webpage
  componentDidMount(){
    //this.restartAnimation();
    this.setState({connectServer: this.connectServer,
        loadHistory: this.loadHistory,
        loadNow: this.loadNow,
        updateConfigOptions: this.updateConfigOptions,
        disConnectServer: this.disConnectServer ,
        synchronizeController: this.synchronizeController ,
        releaseController: this.releaseController ,
        sendMessage:this.sendMessage,
        upDateMaximalTime: this.upDateMaximalTime,
        resetCurrentTime: this.resetCurrentTime});
  }


  // Client control
  connectServer(){
    const addr = "ws://" + document.getElementsByName("addr_txt")[0].value;
    console.log("Connecting to (" + addr + ")...");

    // create the connection
    ws = new WebSocket(addr);
    console.log(ws);
    if (ws != null) {
      const that = this;
      const loadNow = this.loadNow;
      const updateConfigOptions = this.updateConfigOptions;
      const upDateMaximalTime  = this.upDateMaximalTime;
that.setState({connected: true});
      ws.addEventListener('error', function(e) {
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

        that.setState({messages: [...that.state.messages, {
          id: Math.floor((Math.random() * 101) + 1),
          title: 'Error',
          description: 'Connection closed' + (reason ? ': ' + reason : ''),
          type: 'danger'
        }]});
      });

      ws.addEventListener('open', function(e) {
        that.setState({connected: true});
        that.setState({messages: [...that.state.messages, {
          id: Math.floor((Math.random() * 101) + 1),
          title: 'Success',
          description: 'Successfully connected',
          type: 'success'
        }]});
      });

      ws.addEventListener('message', function(evt){
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
          /*this.setState({messages: [...this.state.messages, {
            id: Math.floor((Math.random() * 101) + 1),
            title: 'Error',
            description: err_msg,
            type: 'error'
          }]});*/
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
        else if(evt_type == 'DATA'){
          try{
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
          console.log(e);
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
  disConnectServer(){
    if(ws != null){
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
  synchronizeController(){
    if(ws != null){
      this.setState({synchronized: true});
      if (this.timer) {
        this.timer.stop();
      }
    }
    console.log("synchronized to instance");
  }

  // Quit synchronized mode
  releaseController(){
    if(ws != null){
      this.setState({synchronized: false})
    }
    this.restartAnimation();
    console.log("desynchronized to instance");
  }

  // Send text message through websocket
  sendMessage(){
    if(ws !=null){
      const msg = document.getElementsByName("send_txt")[0].value;
      ws.send(msg);
      console.log("Message being sent")
    }
  }

  // Load maximal time returned from the server
  upDateMaximalTime(){
      const max_time = document.getElementsByName("max_time")[0].value;
      this.setState({maximal_time: max_time}, ()=>
          console.log("Current max time tick is", max_time));
  }

  // Visualization control
  loadHistory(){
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

      sleep(1000).then(()=>{
        this.setState({data_url: dir, prefix: file_names[0]}, ()=>
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
  loadNow(dir){
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
  updateConfigOptions(options){
    this.setState({options:options},()=>console.log(this.state.options))
  }

  // Load Data from websocket
  updateCurrentTick(record){
    this.setState({currentData:record},()=>console.log(this.state.currentData))
  }

  resetCurrentTime(){
    let new_time =  (Math.min(parseFloat(document.getElementsByName("new_time")[0].value), this.state.maximal_time)/0.3/this.time_step).toFixed(0)*this.time_step;
    console.log(new_time)
    this.current_time = new_time
    this.last_time = this.current_time; // Update_time
    this.last_time = this.current_time; // Update_time
    this.timer = null;
    this.currentFrame = null;
    this.setState({plotdata2:{ticks:[], counts:[], arrived:[]}}, ()=>this.restartAnimation());
  }

  // Core functions for visualizing trajectories
  restartAnimation(){
    if (this.timer) {
      this.timer.stop();
    }
    d3.json(this.state.data_url+"/"+this.state.prefix+"."+((this.last_time)/40+1)+".json").then(
        (new_data) => this.setState({subdata: new_data, subswitch: 0, data: []},
            () => {
              this.fetchData(this.last_time+this.time_step);
            }
        )).catch(() => {
          this.setState({messages: [...this.state.messages, {
            id: Math.floor((Math.random() * 101) + 1),
            title: 'Error',
            description: 'Failed to load JSON file: ' + this.state.data_url+"/"+this.state.prefix+"."+((this.last_time)/40+1)+".json",
            type: 'danger'
          }]});
        });
  }

  //'vehicleID', 'startx', 'starty','endx','endy', 'speed', 'originx','originy','destx','desty', 'nearlyArrived', 'type'
  //'vehicleClass', 'roadID'
  fetchData=(current_time) => {
    this.setState({data: this.state.subdata}, () => {
      this.last_time += this.time_step;
      // Alert or stop when time tick arrive
      if(this.last_time > this.state.maximal_time){
        //Alert the user here.
        console.log("Boundary reached");
        if(this.timer){
          this.timer.stop();
        }
      }
      this.startAnimation();
      d3.json(this.state.data_url+"/"+this.state.prefix+"."+((current_time)/40+1)+".json")
        .then(
          (new_data) => this.setState({subdata: new_data},
              () => {console.log("fetching data")}))
        .catch(
          () => {
            this.setState({messages: [...this.state.messages, {
              id: Math.floor((Math.random() * 101) + 1),
              title: 'Error',
              description: 'Failed to load JSON file: ' + this.state.data_url+"/"+this.state.prefix+"."+((current_time)/40+1)+".json",
              type: 'danger'
            }]});
        });
    });
  };

  // Vehicle location, use intercept to reduce the network load
  startAnimation = () => {
    if(this.current_time >= (this.last_time)) {
      console.log("Piece 1 take care of this update.");
      console.log(this.current_time);
      this.fetchData(this.last_time+this.time_step);
    }
    else{
      // console.log(this.state.data)
      if(this.state.data[(this.current_time+this.buffer_time+20).toFixed(1)]){
        // Calculate link speed
        const roadSpeed = new Map(linkdict);
        const roadCount = new Map(linkdict);
        for ( let i = 0; i< this.state.data[(this.current_time+this.buffer_time+20).toFixed(1)].length; i++){
          const record = this.state.data[(this.current_time+this.buffer_time+20).toFixed(1)][i]
          const roadID = record[12];
          roadSpeed.set(roadID, roadSpeed.get(roadID)+record[5])
          roadCount.set(roadID, roadCount.get(roadID)+1)
        }
        // Create special layer for selected vehicle
        // Calculate vehicle location
        if(this.state.subswitch) {
          this.fail_count=0; // refresh the fail count
          this.setState({
            subswitch: 1 - this.state.subswitch,
            roadspeed: roadSpeed,
            roadcount: roadCount,
            vehicles2:
                this.state.data[(this.current_time+this.buffer_time+20).toFixed(1)].map(d => ({
                  id: d[0],
                  lon: d[1],
                  lat: d[2],
                  speed: d[5],
                  originx: d[6],
                  originy: d[7],
                  destx: d[8],
                  desty: d[9],
                  nearlyArrived: d[10],
                  type: d[11],
                  bearing: getDirection(d[1], d[2], d[3], d[4]),
                  interpolatePos: d3.geoInterpolate([d[1], d[2]], [d[3], d[4]])
                }))
          }, () => {
            this.state.plotdata2.ticks.push(this.current_time);
            this.state.plotdata2.counts.push(this.state.vehicles2.length);
            let a = this.state.vehicles2.filter(v => {
              return v.nearlyArrived > 0;//v.lon == v.destx && v.lat == v.desty;
            });
            this.state.arrived += a.length;
            this.state.plotdata2.arrived.push(this.state.arrived);
            this.current_time += this.buffer_time;
            this.currentFrame = 0;
            this.timer = d3.timer(this.animationFrame);
          })
        }
        else{
          this.setState({
            subswitch: 1-this.state.subswitch,
            roadspeed: roadSpeed,
            roadcount: roadCount,
            vehicles1:
                this.state.data[(this.current_time+this.buffer_time+20).toFixed(1)].map(d => ({
                  id: d[0],
                  lon: d[1],
                  lat: d[2],
                  speed: d[5],
                  originx: d[6],
                  originy: d[7],
                  destx: d[8],
                  desty: d[9],
                  nearlyArrived: d[10],
                  type: d[11],
                  bearing: getDirection(d[1], d[2], d[3], d[4]),
                  interpolatePos: d3.geoInterpolate([d[1], d[2]], [d[3], d[4]])
                }))}, ()=> {
            this.state.plotdata2.ticks.push(this.current_time);
            this.state.plotdata2.counts.push(this.state.vehicles1.length);
            let a = this.state.vehicles1.filter(v => {
              return v.nearlyArrived > 0;//v.lon == v.destx && v.lat == v.desty;
            });
            this.state.arrived += a.length;
            this.state.plotdata2.arrived.push(this.state.arrived);
            this.current_time += this.buffer_time;
            this.currentFrame = 0;
            this.timer = d3.timer(this.animationFrame);
          })
        }
      }
      else{
        // The internet speed does not support this visualization speed, let's make the speed lower and reload the visualization
        this.fail_count+=1
        console.log("Piece 2 take care of this update.");
        console.log(this.current_time)
        if(this.fail_count>5) {
          this.fail_count=0;
          this.restartAnimation(); // Fail to load data, skip the current tick
        }else{
          sleep(500).then(() => {
            this.startAnimation();
          })
        }
      }
    }
  };

  animationFrame = () => {
    //console.log(this.currentFrame)
    if(this.currentFrame>=(this.framesPerTick-this.state.settings.speed)){
      if (this.timer) {
        this.timer.stop();
      }
      this.startAnimation()
    }
    else {
      if(this.state.subswitch){
        let {vehicles1} = this.state;
        vehicles1 = vehicles1.map(d => {
          const [lon, lat] = d.interpolatePos(this.currentFrame / (this.framesPerTick-this.state.settings.speed));
          return {
            ...d,
            lon,
            lat
          };
        });
        if(this.state.settings.play){
          this.currentFrame += 1;
          this.setState({vehicles1});
        }
      }
      else{
        let {vehicles2} = this.state;
        vehicles2 = vehicles2.map(d => {
          const [lon, lat] = d.interpolatePos(this.currentFrame / (this.framesPerTick-this.state.settings.speed));
          return {
            ...d,
            lon,
            lat
          };
        });
        if(this.state.settings.play){
          this.currentFrame += 1;
          this.setState({vehicles2});
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

  _onSelectVehicle({object}){
    console.log('Selected');
    console.log(object);
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

  // Tooltip for vehicles
  _renderTooltip() {
    const {x, y, hovered_object} = this.state;
    return (
        // if hoveredObject is null, then the rest part won't be execute
        hovered_object && (
            <div className="tooltipp" style={{top: y, left: x}}>
              <div> Vehicle id: {hovered_object.id} </div>
              <div> Speed: {(hovered_object.speed*3.6).toFixed(2)} km/h</div>
              <div> Type: {hovered_object.type} </div>
            </div>
        )
    );
  }

  // Tooltip for roads
  _renderTooltip2(){
    const { x2, y2, hovered_link, roadcount, roadspeed} = this.state;
    return (
        // if hoveredObject is null, then the rest part won't be execute
        hovered_link && (
            <div className="tooltipp" style={{top: y2, left: x2}}>
              <div> Link id: {hovered_link.properties.Id} </div>
              <div> Average Speed: {(roadcount.get(hovered_link.properties.Id)==0)?-1:
                  (roadspeed.get(hovered_link.properties.Id)*3.6/(roadcount.get(hovered_link.properties.Id))).toFixed(2)} km/h</div>
            </div>
        )
    );
  }

  switchTab(e){
    let links = document.querySelectorAll('.nav-link');

    links.forEach(el => {
      el.classList.remove('active');
      document.getElementById(el.getAttribute('href').replace('#', '')).classList.remove('active');
    });

    //let el = e.target;
    e.classList.add('active');
    document.getElementById(e.getAttribute('href').replace('#', '')).classList.add('active');
  }

  render(){
    let layers = [];
    if(!this.state.synchronized) {
      if (this.state.settings.style==1) {
        layers.push([new HeatmapLayer({
          id: 'heatmap-vehicles',
          data: this.state.vehicles1,
          visible: this.state.subswitch,
          pickable: false,
          getPosition: d => [d.lon, d.lat],
          getWeight: 1,
          radiusPixels: 20,
          intensity: 2,
          threshold: 0.1
        }),new HeatmapLayer({
          id: 'heatmap-vehicles2',
          data: this.state.vehicles2,
          visible: 1-this.state.subswitch,
          pickable: false,
          getPosition: d => [d.lon, d.lat],
          getWeight: 1,
          radiusPixels: 20,
          intensity: 2,
          threshold: 0.1
        })]);
      } else{
        layers.push([new IconLayer({
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
          getIcon: d => "vehicle",
          getAngle: d => d.bearing-90,
        }),new IconLayer({
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
          getIcon: d => "vehicle",
          getAngle: d => d.bearing-90,
        })])
      }};

      // Optional layers
      if (this.state.settings.mode) {
        layers.unshift(new GeoJsonLayer({
          id: 'geojson-link',
          data: linkData,
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
          getLineColor: f => COLOR_SCALE((this.state.roadcount.get(f.properties.Id)==0)?40:
              (this.state.roadspeed.get(f.properties.Id)*3.6/(this.state.roadcount.get(f.properties.Id)))),
          getLineWidth: f => 200,//(this.state.roadcount.get(f.properties.Id)==0)?0: 200,
          updateTriggers: {
            getLineColor: this.current_time,
            getLineWidth: this.current_time
          }
        }))
      }

    if (this.state.selected_vehicle){
      layers.push([new IconLayer({
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
        getPosition:  d =>[d.originx, d.originy],
        getIcon: d =>"origin_pin",
      }),new IconLayer({
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
        getPosition: d => [d.destx, d.desty],
        getIcon: d =>"dest_pin",
      }),new IconLayer({
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
          getIcon: d => "vehicle",
          getAngle: d => d.bearing-90,
        }),new IconLayer({
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
          getIcon: d => "vehicle",
          getAngle: d => d.bearing-90,
        })]);
    }
    if(this.state.synchronized) {
      layers.unshift(new GeoJsonLayer({
        id: 'geojson-link2',
        data: linkData,
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
        getLineColor: f => [200, 200, 200],
        getLineWidth: f => 300,//(this.state.roadcount.get(f.properties.Id)==0)?0: 200
      }))
    }

    let staticMap;
    staticMap = <StaticMap mapboxApiAccessToken={MAPBOX_ACCESS_TOKEN}/>;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {

      staticMap = <StaticMap mapboxApiAccessToken={MAPBOX_ACCESS_TOKEN} mapStyle="mapbox://styles/mapbox/dark-v9"/>;
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
          </div>
          <div className="app-pane app-stats">
            <Panel {...this.state} />
          </div>
          <div className="app-pane app-plots">
            <Chart {...this.state} />
          </div>
          <Legend {...this.state} />
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
