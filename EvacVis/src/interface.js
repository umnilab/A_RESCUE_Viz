import React, { Component } from 'react';
import PropTypes from 'prop-types';

export class Interface extends Component {

  constructor(props) {
    super(props);
  }

  _onChange(event) {
    let newValue = this.props.theme == "dark" ? "light" : "dark";
    /*if (!event.target.value) {
      newValue = "light";
    }*/
    document.getElementsByTagName('body')[0].className = newValue;
    this.props.onChange(newValue);
  }

  render() {
    const {theme} = this.props;

    return (
      <div className="app-interface card" id="app-interface">
        <div className="card-body">
          {/*<Toggle
            key="theme"
            settingName="theme"
            settingLabel="Theme"
            value={theme}
            onChange={this._onChange.bind(this)}
          />*/}
          <div className="row"><div className="col-md-5">Theme</div><div className="col-md-7 text-right">
          <div className="form-group form-switch">
          Light
          <span className="custom-control custom-switch">
            <input type="checkbox" className="custom-control-input" value="dark" id="themeSwitch" checked={theme == "dark"}
            onChange={this._onChange.bind(this)}/>
            <label className="custom-control-label" forhtml="themeSwitch">Dark</label>
          </span>
          </div></div>
          </div>
        </div>
      </div>
    );
  }
}

Interface.propTypes = {
  propTypes: PropTypes.object,
  onChange: PropTypes.func
}

const Toggle = ({ settingName, settingLabel, value, onChange }) =>{
  const optValue = [{label: "Light", value: "light"},{label: "Dark", value: "dark"}];//{label: "Auto", value: "auto"},

  return (
    <div className="form-group" key={settingName}>
      <label>{settingLabel}</label>
      <div className="btn-group btn-group-toggle" data-toggle="buttons" key={settingName + '-group'}>
        {optValue.map(option => (
            <label key={settingName + '-' + option.value + '-label'} className={value == option.value ? 'btn btn-secondary active' : 'btn btn-secondary'} htmlFor={settingName + '-' + option.value}>
              <input type="radio" name={settingName} id={settingName + '-' + option.value}
                key={settingName + '-' + option.value}
                checked={value == option.value}
                value={option.value}
                onChange={e => onChange(e.target.value)} /> {option.label}
            </label>
        ))}
      </div>
    </div>
  )
}
Toggle.propTypes = {
  settingName: PropTypes.string,
  settingLabel: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func
}
