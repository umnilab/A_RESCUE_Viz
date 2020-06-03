import React, {Component} from 'react';
import DeckGL, {IconLayer, GeoJsonLayer} from 'deck.gl';
import {StaticMap} from "react-map-gl";
import * as d3 from "d3";

import {
  LayerControls,
  TRIPS_CONTROLS
} from './controls';
import {Panel} from "./panel";
import {Legend} from "./legend";
import {Client} from "./client";
import {scaleThreshold} from 'd3-scale';

import linkData from '../res/road.json';
import car1 from "../res/car1.png";
import car2 from "../res/car2.png";
import red_pin from "../res/pin_red.png";
import blue_pin from "../res/pin_blue.png";


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
  var result = null;
  $.ajax({
    url: my_url,
    type: 'get',
    dataType: 'html',
    async: false,
    success: function(data) {
      result =  parseDirectoryListing(data);
    }
  });
  return result;
}

function parseDirectoryListing(text)
{
  let docs = text
      .match(/href="([\w-]+)/g) // pull out the hrefs
      .map((x) => x.replace('href="', '')); // clean up
  console.log(docs);
  return docs;
}

class App extends Component{
  constructor(props){
    super(props);

    this.state = {
      connected: false,
      data_url: null,
      prefix: null,
      data: [], //current data
      subdata: [], //new data
      vehicles1: [],
      vehicles2: [],
      roadspeed: new Map(linkdict),
      roadcount: new Map(linkdict),
      data_address: null,
      maximal_time: 3e6, //maximal ticks
      options: "", //options for client side control
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
    this._renderTooltip = this._renderTooltip.bind(this);
    this._renderTooltip2 = this._renderTooltip2.bind(this);
    this.connectServer = this.connectServer.bind(this);
    this.loadHistory = this.loadHistory.bind(this);
    this.loadNow = this.loadNow.bind(this);
    this.updateConfigOptions = this.updateConfigOptions.bind(this);
    this.disConnectServer = this.disConnectServer.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.upDateMaximalTime = this.upDateMaximalTime.bind(this);
    this.resetCurrentTime = this.resetCurrentTime.bind(this);
  }

  current_time=0; // Visualization_time
  last_time = this.current_time; // Update_time
  timer = null;
  time_step=40; // Ticks per file
  buffer_time = 20; // Buffer_time for loading new data
  currentFrame = null;
  framesPerTick = 70; //The maximum frame per tick

  // When open the webpage
  componentDidMount(){
    //this.restartAnimation();
    this.setState({connectServer: this.connectServer,
        loadHistory: this.loadHistory,
        loadNow: this.loadNow,
        updateConfigOptions: this.updateConfigOptions,
        disConnectServer: this.disConnectServer ,
        sendMessage:this.sendMessage,
        upDateMaximalTime: this.upDateMaximalTime,
        resetCurrentTime: this.resetCurrentTime});
  }


  // Simulation control
  connectServer(){
    const addr = "ws://" + document.getElementsByName("addr_txt")[0].value;
    console.log("Connecting to (" + addr + ")...");

    // create the connection
    ws = new WebSocket(addr);
    if(ws!=null){
      this.setState({connected: true})
      const loadNow = this.loadNow;
      const updateConfigOptions = this.updateConfigOptions;
      const upDateMaximalTime  = this.upDateMaximalTime;
      ws.onmessage=function(evt){

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
        else {
          // handle an unknown message type
        }
      }
    }
    else{
      console.log("Connection failed");
    }


  }

  disConnectServer(){
    if(ws != null){
      ws.close();
      ws = null;
    }
    this.setState({connected: false})
    console.log("connection closed");
  }

  sendMessage(){
    if(ws !=null){
      const msg = document.getElementsByName("send_txt")[0].value;
      ws.send(msg);
      console.log("Message being sent")
    }
  }

  upDateMaximalTime(){
      const max_time = document.getElementsByName("max_time")[0].value;
      this.setState({maximal_time: max_time}, ()=>
          console.log("Current max time tick is", max_time));
  }

  // Visualization control
  loadHistory(){
    //console.log(dir);
    let dir = document.getElementsByName("hist_txt")[0].value;
    let file_names = loadHistories(document.getElementsByName("hist_txt")[0].value);
    sleep(1000).then(()=>{
      console.log(file_names);
      this.setState({data_url: dir, prefix: file_names[0]}, ()=>
          this.resetCurrentTime())
    });
  }

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

  updateConfigOptions(options){
    this.setState({options:options},()=>console.log(this.state.options))
  }

  resetCurrentTime(){
    let new_time =  (Math.min(parseFloat(document.getElementsByName("new_time")[0].value), this.state.maximal_time)/0.3/this.time_step).toFixed(0)*this.time_step;
    console.log(new_time)
    this.current_time = new_time
    this.last_time = this.current_time; // Update_time
    this.last_time = this.current_time; // Update_time
    this.timer = null;
    this.currentFrame = null;
    this.restartAnimation()
  }

  // Core functions
  restartAnimation(){
    if (this.timer) {
      this.timer.stop();
    }
    d3.json(this.state.data_url+"/"+this.state.prefix+"."+((this.last_time)/40 +1 )+".json").then(
        (new_data) => this.setState({subdata: new_data, subswitch: 0, data: []},
            () => {
              this.fetchData(this.last_time+this.time_step);
            }
        ));
  }

  //'vehicleID', 'startx', 'starty','endx','endy', 'speed', 'originx','originy','destx','desty', 'nearlyArrived'
  //'vehicleClass', 'roadID'
  fetchData=(current_time) => {
    this.setState({data: this.state.subdata}, () => {
      this.last_time += this.time_step;
      // Alert or stop when time tick arrive
      if(this.last_time > this.state.maximal_time){
        //Alert the user here.
        Console.log("Boundary reached")
      }
      this.startAnimation();
      d3.json(this.state.data_url+"/"+this.state.prefix+"."+((current_time)/40+1)+".json").then(
          (new_data) => this.setState({subdata: new_data},
              () => {console.log("fetching data")}));
    });
  };

  startAnimation = () => {
    if(this.current_time >= (this.last_time)) {
      this.fetchData(this.last_time+this.time_step);
    }
    else{
      //console.log(this.state.data[(this.current_time).toFixed(1)])
      if(this.state.data[(this.current_time+this.buffer_time).toFixed(1)]){
        // Calculate link speed
        const roadSpeed = new Map(linkdict);
        const roadCount = new Map(linkdict);
        for ( let i = 0; i< this.state.data[(this.current_time+this.buffer_time).toFixed(1)].length; i++){
          const record = this.state.data[(this.current_time+this.buffer_time).toFixed(1)][i]
          const roadID = record[12];
          roadSpeed.set(roadID, roadSpeed.get(roadID)+record[5])
          roadCount.set(roadID, roadCount.get(roadID)+1)
        }
        // Create special layer for selected vehicle
        // Calculate vehicle location
        if(this.state.subswitch) {
          this.setState({
            subswitch: 1 - this.state.subswitch,
            roadspeed: roadSpeed,
            roadcount: roadCount,
            vehicles2:
                this.state.data[(this.current_time+this.buffer_time).toFixed(1)].map(d => ({
                  id: d[0],
                  lon: d[1],
                  lat: d[2],
                  speed: d[5],
                  originx: d[6],
                  originy: d[7],
                  destx: d[8],
                  desty: d[9],
                  type: d[11],
                  bearing: getDirection(d[1], d[2], d[3], d[4]),
                  interpolatePos: d3.geoInterpolate([d[1], d[2]], [d[3], d[4]])
                }))
          }, () => {
            this.current_time += this.buffer_time;
            this.currentFrame = 0;
            this.timer = d3.timer(this.animationFrame);
          })
        }
        else{
          this.setState({subswitch: 1-this.state.subswitch,
            roadspeed: roadSpeed,
            roadcount: roadCount,
            vehicles1:
                this.state.data[(this.current_time+this.buffer_time).toFixed(1)].map(d => ({
                  id: d[0],
                  lon: d[1],
                  lat: d[2],
                  speed: d[5],
                  originx: d[6],
                  originy: d[7],
                  destx: d[8],
                  desty: d[9],
                  type: d[11],
                  bearing: getDirection(d[1], d[2], d[3], d[4]),
                  interpolatePos: d3.geoInterpolate([d[1], d[2]], [d[3], d[4]])
                }))}, ()=> {
            this.current_time += this.buffer_time;
            this.currentFrame = 0;
            this.timer = d3.timer(this.animationFrame);
          })
        }
      }
      else{
        this.restartAnimation();
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
    this.setState({selected_vehicle:{id:object.id,
        originx:object.originx,
        originy:object.originy,
        destx: object.destx,
        desty: object.desty}});
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


  _renderTooltip() {
    const {x, y, hovered_object} = this.state;
    return (
        // if hoveredObject is null, then the rest part won't be execute
        hovered_object && (
            <div className="tooltip" style={{top: y, left: x}}>
              <div> Vehicle id: {hovered_object.id} </div>
              <div> Speed: {(hovered_object.speed*3.6).toFixed(2)} km/h</div>
              <div> Type: {hovered_object.type} </div>
            </div>
        )
    );
  }
  _renderTooltip2(){
    const { x2, y2, hovered_link, roadcount, roadspeed} = this.state;
    return (
        // if hoveredObject is null, then the rest part won't be execute
        hovered_link && (
            <div className="tooltip" style={{top: y2, left: x2}}>
              <div> Link id: {hovered_link.properties.Id} </div>
              <div> Average Speed: {(roadcount.get(hovered_link.properties.Id)==0)?-1:
                  (roadspeed.get(hovered_link.properties.Id)*3.6/(roadcount.get(hovered_link.properties.Id))).toFixed(2)} km/h</div>
            </div>
        )
    );
  }

  render(){
    let layers = [new IconLayer({
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
    })];
    // Optional layers
    if(this.state.settings.mode) {
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
    if(this.state.selected_vehicle){
      layers.push([new IconLayer({
        id: 'scatterplot-origin',
        data: [this.state.selected_vehicle],
        iconAtlas: red_pin,
        iconMapping:{
          origin_pin:{
            x: 0,
            y: 0,
            width: 512,
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
        iconAtlas: blue_pin,
        iconMapping:{
          dest_pin:{
            x: 0,
            y: 0,
            width: 512,
            height: 512,
            anchorY: 512
          }
        },
        sizeScale: 50,
        getPosition: d => [d.destx, d.desty],
        getIcon: d =>"dest_pin",
      })])
    }

    return(
        <div>
          <LayerControls
              settings={this.state.settings}
              propTypes={TRIPS_CONTROLS}
              onChange={settings => this._updateLayerSettings(settings)}
              currentTime={Math.ceil((this.current_time+ this.buffer_time*this.currentFrame/ (this.framesPerTick-this.state.settings.speed)))}
              resetCurrentTime = {this.resetCurrentTime}
          />
          <DeckGL
              initialViewState={initialViewState}
              controller={true}
              layers={layers}
              onViewStateChange={this._onViewStateChange}
          >
            <StaticMap mapboxApiAccessToken={MAPBOX_ACCESS_TOKEN}/>
            {this._renderTooltip}
            {this._renderTooltip2}
          </DeckGL>
          <Panel {...this.state} />
          <Legend {...this.state} />
          <Client {...this.state} />
        </div>
    );
  }
}

export default App;
