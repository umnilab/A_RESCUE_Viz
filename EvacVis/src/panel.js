import {panel} from "./style";
import React, { Component } from 'react';
import red_pin from "../res/pin_red.svg";
import blue_pin from "../res/pin_blue.svg";
import shelter_full from "../res/shelter_full.svg";
import shelter_open from "../res/shelter_open.svg";
import expand from "../res/chevron-up.svg";
import collapse from "../res/chevron-down.svg";
import car1 from "../res/car1.png";
import car2 from "../res/car2.png";

export class Panel extends Component{
    constructor(props) {
        super(props);
        this.state = {
            collapsed: false
        };

        this.togglePanel = this.togglePanel.bind(this);
    }

    togglePanel() {
        this.setState({ collapsed: this.state.collapsed ? false : true });
    }

    render(){
        const {vehicles1, vehicles2, selected_vehicle, selected_link} = this.props;

        let collapsed = this.state.collapsed;
        let className = collapsed ? "info-panel card collapsed" : "info-panel card expanded";

            return(
                <div className={className}>
                    <button className="btn btn-sm btn-minimize" aria-hidden="true" onClick={this.togglePanel} data-tip={collapsed ? "Expand" : "Collapse"}>
                        <img
                          key="info-panel-size"
                          src={collapsed ? expand : collapse}
                          alt={collapsed ? "Expand" : "Collapse"}/>
                    </button>

                    <div className="card-body">
                        <div className="row">
                            <div className="col-3">
                                <h4 className="card-title">Vehicles</h4>

                                <div className="info-group container-fluid">
                                    <div className="row">
                                        <div className="col-9">On road:</div>
                                        <div className="col-3 text-right info-value">{Math.max(vehicles1.length,vehicles2.length)}</div>
                                    </div>
                                    <div className="row">
                                        <div className="col-9">Avg. speed:</div>
                                        <div className="col-3 text-right info-value">0</div>
                                    </div>
                                    <div className="row">
                                        <div className="col-6">
                                            <img
                                                src={car1}
                                                alt="Red car"
                                                height="14"/> Red
                                        </div>
                                        <div className="col-6 text-right">
                                            <img
                                                src={car2}
                                                alt="Yellow car"
                                                height="14"/> Yellow
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-3">
                                <h4 className="card-title">Shelters</h4>

                                <div className="info-group container-fluid">
                                    <div className="row">
                                        <div className="col-9">Total occupancy:</div>
                                        <div className="col-3 text-right info-value">0</div>
                                    </div>
                                    <div className="row">
                                        <div className="col-9">Remaining space:</div>
                                        <div className="col-3 text-right info-value">0</div>
                                    </div>
                                    <div className="row">
                                        <div className="col-5">
                                            <img
                                                src={shelter_full}
                                                alt="Shelter has no available space"
                                                height="12"/> Full
                                        </div>
                                        <div className="col-7 text-right">
                                            <img
                                                src={shelter_open}
                                                alt="Available shelter"
                                                height="12"/> Available
                                        </div>
                                    </div>
                                    {/*<div className="row">
                                        <div className="col-6">
                                            Full
                                        </div>
                                        <div className="col-6 text-right">
                                            Available
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-2">
                                            <img
                                                src={shelter_full}
                                                alt="Shelter has no available space"
                                                height="12"/>
                                        </div>
                                        <div className="col-8">
                                            <div className="progress">
                                                <div className="progress-bar" role="progressbar" style={{width: '25%' }} aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">25%</div>
                                            </div>
                                        </div>
                                        <div className="col-2 text-right">
                                            <img
                                                src={shelter_open}
                                                alt="Available shelter"
                                                height="12"/>
                                        </div>
                                    </div>*/}
                                </div>
                            </div>
                            <div className="col-3">
                                <h4 className="card-title">Selected Link</h4>

                                <div className="info-group container-fluid">
                                    <div className="row"><div className="col-6">Link ID:</div><div className="col-6 text-right info-value">{selected_link ? selected_link.Id : '--'}</div></div>
                                    <div className="row"><div className="col-7">Link length:</div><div className="col-5 text-right info-value">{selected_link ? selected_link.length.toFixed(1) : 0} m</div></div>
                                    <div className="row"><div className="col-7">Speed limit:</div><div className="col-5 text-right info-value">{selected_link ? selected_link.freeflowsp : 0} km/h</div></div>
                                </div>
                            </div>
                            <div className="col-3">
                                <h4 className="card-title">Selected Vehicle</h4>

                                <div className="info-group container-fluid">
                                    <div className="row"><div className="col-7">Vehicle ID:</div><div className="col-5 text-right info-value">{selected_vehicle ? selected_vehicle.id : '--'}</div></div>
                                    <div className="row"><div className="col-9">Origin:</div><div className="col-3 text-right">
                                        <img
                                            src={red_pin}
                                            alt="Origin pin"
                                            height="12"/>
                                    </div></div>
                                    <div className="row"><div className="col-9">Destination:</div><div className="col-3 text-right">
                                        <img
                                            src={blue_pin}
                                            alt="Destination pin"
                                            height="12"/>
                                    </div></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
    }
}
