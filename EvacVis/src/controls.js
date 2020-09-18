import React, { Component } from 'react';
import { mapStylePicker, layerControl } from './style';
import play from "../res/play.svg";
import pause from "../res/pause.svg";

export const TRIPS_CONTROLS = {
  mode: {
    displayName: 'Traffic condition',
    //type: 'boolean',
    //value: false
    type: 'select',
    value: 0,
    optValue: [{label: "Off", value: 0},{label: "On", value: 1}]
  },
  style: {
    displayName: 'Display',
    type: 'select',
    value: 0,
    optValue: [{label: "Vehicle Trajectory", value: 0},{label: "Vehicle HeatMap", value: 1}]
  },
  congestion: {
    displayName: 'Congestion levels',
    type: 'select',
    value: 0,
    optValue: [{label: "Off", value: 0},{label: "On", value: 1}]
  },
  speed: {
    displayName: 'Play speed',
    type: 'range',
    value: 0,
    step: 10,
    min: 0,
    max: 50
  },
  play: {
    displayName: '',
    type: 'image',
    value: true
  }
};

const MAPBOX_DEFAULT_MAPSTYLES = [
  { label: 'Streets V10', value: 'mapbox://styles/mapbox/streets-v10' },
  { label: 'Outdoors V10', value: 'mapbox://styles/mapbox/outdoors-v10' },
  { label: 'Light V9', value: 'mapbox://styles/mapbox/light-v9' },
  { label: 'Dark V9', value: 'mapbox://styles/mapbox/dark-v9' },
  { label: 'Satellite V9', value: 'mapbox://styles/mapbox/satellite-v9' },
  {
    label: 'Satellite Streets V10',
    value: 'mapbox://styles/mapbox/satellite-streets-v10'
  },
  {
    label: 'Navigation Preview Day V4',
    value: 'mapbox://styles/mapbox/navigation-preview-day-v4'
  },
  {
    label: 'Navitation Preview Night V4',
    value: 'mapbox://styles/mapbox/navigation-preview-night-v4'
  },
  {
    label: 'Navigation Guidance Day V4',
    value: 'mapbox://styles/mapbox/navigation-guidance-day-v4'
  },
  {
    label: 'Navigation Guidance Night V4',
    value: 'mapbox://styles/mapbox/navigation-guidance-night-v4'
  }
];

export function MapStylePicker({ currentStyle, onStyleChange }) {
  return (
    <select
      className="map-style-picker"
      style={mapStylePicker}
      value={currentStyle}
      onChange={e => onStyleChange(e.target.value)}
    >
      {MAPBOX_DEFAULT_MAPSTYLES.map(style => (
        <option key={style.value} value={style.value}>
          {style.label}
        </option>
      ))}
    </select>
  );
}

export class LayerControls extends Component {

  constructor(props) {
    super(props);
    this.state = {
      new_time: 0
    }
    this.upDateTime = this.upDateTime.bind(this);
  }

  _onValueChange(settingName, newValue) {
    const { settings } = this.props;
    // Only update if we have a confirmed change
    if (settings[settingName] !== newValue) {
      // Create a new object so that shallow-equal detects a change
      const newSettings = {
        ...this.props.settings,
        [settingName]: newValue
      };

      this.props.onChange(newSettings);
    }
  }

  upDateTime(){
    this.setState({new_time:
          (parseFloat(document.getElementsByName("new_time")[0].value))?(parseFloat(document.getElementsByName("new_time")[0].value)).toFixed(0): 0});
  }

  render() {
    const { title, settings, propTypes = {}, currentTime, resetCurrentTime} = this.props;
    const {new_time} = this.state;

    return (
      <div>
      <div className="layer-controls card">
        <div className="card-header">
          {title && <h4 className="card-title">{title}</h4>}
        </div>
        <div className="card-body">
          <Setting
              key="mode"
              settingName="mode"
              settingLabel={propTypes['mode'].displayName}
              value={settings['mode']}
              propType={propTypes['mode']}
              onChange={this._onValueChange.bind(this)}
            />
          <Setting
              key="style"
              settingName="style"
              settingLabel={propTypes['style'].displayName}
              value={settings['style']}
              propType={propTypes['style']}
              onChange={this._onValueChange.bind(this)}
            />
        </div>
      </div>

      <div className="layer-controls card">
        <div className="card-header">
          <h4 className="card-title">Playback</h4>
        </div>
        <div className="card-body">
          <div className="form-group">
            <label htmlFor="new_time">Simulation time (seconds)</label>
            <span className="badge badge-light">{(currentTime*0.3).toFixed(0)}</span>
            <div className="input-group">
              <input type="number" name="new_time" id="new_time" className="form-control" value={new_time} size="10" onChange={this.upDateTime}/>
              <span className="input-group-append"><input type="button" name="jump_btn" className="btn btn-secondary" value="Jump" size="10"
                   onClick={resetCurrentTime}/></span>
            </div>
          </div>

          <div className="row">
            <div className="col-md-8">
              <Setting
                key="speed"
                settingName="speed"
                settingLabel={propTypes['speed'].displayName}
                value={settings['speed']}
                propType={propTypes['speed']}
                onChange={this._onValueChange.bind(this)}
              />
            </div>
            <div className="col-md-4 text-right">
              <Setting
                key="play"
                settingName="play"
                settingLabel={propTypes['play'].displayName}
                value={settings['play']}
                propType={propTypes['play']}
                onChange={this._onValueChange.bind(this)}
              />
            </div>
          </div>

          {/*Object.keys(settings).map(key => (
              <Setting
                key={key}
                settingName={key}
                settingLabel={propTypes[key].displayName}
                value={settings[key]}
                propType={propTypes[key]}
                onChange={this._onValueChange.bind(this)}
              />
          ))*/}
        </div>
      </div></div>
    );
  }
}

const Setting = props => {
  const { propType } = props;
  if (propType && propType.type) {
    switch (propType.type) {
      case 'range':
        return <Slider {...props} />;

      case 'boolean':
        return <Checkbox {...props} />;

      case 'image':
        return <ImageBtn {...props} />;

      case 'select':
        return <Selector {...props} />;

      case 'list':
        return <SelectList {...props} />;

      default:
        return <input {...props} />;
    }
  }
};

const Checkbox = ({ settingName, settingLabel, value, onChange }) => {
  return (
    <div className="form-check" key={settingName}>
        <input
          type="checkbox"
          className="form-check-input"
          key={settingName + '-checkbox'}
          id={settingName}
          checked={value}
          onChange={e => onChange(settingName, e.target.checked)}
        />
        <label className="form-check-label" htmlFor={settingName} key={settingName + '-label'}>{settingLabel}</label>
    </div>
  );
};

const Slider = ({ settingName, settingLabel, value, propType, onChange }) => {
  const { max, min, step } = propType;

  return (
    <div className="form-group" key={settingName}>
      <label htmlFor={settingName}>
        {settingLabel}
      </label>
      <span className="badge badge-light" key={settingName + '-badge'}>
        {value}
      </span>
      <input
        key={settingName + '-range'}
        type="range"
        className="custom-range"
        id={settingName}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(settingName, Number(e.target.value))}
      />
    </div>
  );
};

const ImageBtn = ({ settingName, value, onChange }) => {
  return (
    <div className="form-group" key={settingName}>
      <button className="btn btn-secondary" id={settingName} key={settingName + '-btn'} onClick={e => onChange(settingName, !value)}>
        <img
          key={settingName + '-' + value}
          src={value ? pause : play}
          alt={value ? "Pause" : "Resume"}
          width="32" 
          height="32"/>
      </button>
    </div>
  );
};

const Selector = ({ settingName, settingLabel, value, propType, onChange }) =>{
  const {optValue} = propType;
  return(
    <div className="form-group" key={settingName}>
      <label>{settingLabel}</label>
      <div className="btn-group btn-group-toggle" data-toggle="buttons" key={settingName + '-group'}>
        {optValue.map(option => (
            <label key={settingName + '-' + option.value + '-label'} className={value == option.value ? 'btn btn-light active' : 'btn btn-light'} htmlFor={settingName + '-' + option.value}>
              <input type="radio" name={settingName} id={settingName + '-' + option.value}
                key={settingName + '-' + option.value}
                checked={value == option.value}
                value={option.value}
                onChange={e => onChange(settingName, parseInt(e.target.value))} /> {option.label}
            </label>
        ))}
      </div>
    </div>
  )
}

const SelectList = ({ settingName, settingLabel, value, propType, onChange }) =>{
  const {optValue} = propType;
  return(
    <div key={settingName}>
      <label htmlFor={settingName}>
        {settingLabel}
      </label>
      <span className="badge badge-light">
        {value}
      </span>
      <select
        className="form-control"
        value={value}
        onChange={e => onChange(settingName, e.target.value)}
      >
        {optValue.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
        ))}
      </select>
    </div>
  )
}
