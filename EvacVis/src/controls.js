import React, { Component } from 'react';
import { mapStylePicker, layerControl } from './style';
import play from "../res/play.png";
import pause from "../res/pause.png";

export const TRIPS_CONTROLS = {
  mode: {
    displayName: 'Traffic condition',
    type: 'boolean',
    value: false
  },
  style: {
    displayName: 'Display',
    type: 'select',
    value: 0,
    optValue: [{label: "Vehicle Trajectory", value: 0},{label: "Vehicle HeatMap",value: 1}]
  },
  play: {
    displayName: '',
    type: 'image',
    value: true
  },
  speed: {
    displayName: 'Play speed',
    type: 'range',
    value: 0,
    step: 10,
    min: 0,
    max: 50
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
      <div className="layer-controls" style={layerControl}>
        {title && <h4>{title}</h4>}
        <div>
        Simulation time(s): {(currentTime*0.3).toFixed(0)}
        </div>

        <div style={{float:"left"}}>
          <input type="text" name="new_time" value={new_time} size="10" onChange={this.upDateTime}/>
          <input type="button" name="jump_btn" value="Jump" size="10"
                 onClick={resetCurrentTime}/>
        </div>

        <div style={{clear:"both"}}>&nbsp;</div>

        {Object.keys(settings).map(key => (
          <div key={key}>
            <label>{propTypes[key].displayName}</label>
            <div style={{ display: 'inline-block', float: 'right' }}>
              {settings[key]}
            </div>
            <Setting
              settingName={key}
              value={settings[key]}
              propType={propTypes[key]}
              onChange={this._onValueChange.bind(this)}
            />
          </div>
        ))}
      </div>
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

      default:
        return <input {...props} />;
    }
  }
};

const Checkbox = ({ settingName, value, onChange }) => {
  return (
    <div key={settingName} style={{float:"left"}}>
      <div className="input-group">
        <input
          type="checkbox"
          id={settingName}
          checked={value}
          onChange={e => onChange(settingName, e.target.checked)}
        />
      </div>
    </div>
  );
};

const Slider = ({ settingName, value, propType, onChange }) => {
  const { max, min, step } = propType;

  return (
    <div key={settingName} style={{clear:"both"}}>
      <div className="input-group">
        <div>
          <input
            type="range"
            id={settingName}
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={e => onChange(settingName, Number(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
};

const ImageBtn = ({ settingName, value, onChange }) => {
  return (
    <div key={settingName} style={{clear:"both"}}>
      <div className="input-group">
        <button id={settingName} onClick={e => onChange(settingName, !value)}>
        <img
          src={value ? pause : play}
          alt={value ? "Pause" : "Resume"}
          width="40" 
          height="40"/>
        </button>
      </div>
    </div>
  );
};


const Selector = ({ settingName, value, propType, onChange }) =>{
  const {optValue} = propType;
  return(
      <div key={settingName} style={{clear:"both"}}>
        <div className="input-group">
          <select
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
      </div>
  )
}