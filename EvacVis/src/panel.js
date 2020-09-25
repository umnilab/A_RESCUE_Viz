import {panel} from "./style";
import React, { Component } from 'react';
//import red_pin from "../res/pin_red.svg";
//import blue_pin from "../res/pin_blue.svg";
import PinOrigin from "../res/pin_red.svg";
import PinDestination from "../res/pin_blue.svg";
//import shelter_full from "../res/shelter_full.svg";
//import shelter_open from "../res/shelter_open.svg";
import ShelterFull from "../res/shelter_full.svg";
import ShelterOpen from "../res/shelter_open.svg";
import Road from "../res/road.svg";
import car4 from "../res/car4.png";
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
                    {/*<button className="btn btn-sm btn-minimize" aria-hidden="true" onClick={this.togglePanel} data-tip={collapsed ? "Expand" : "Collapse"}>
                        <span className="icon-chevron"></span><span className="sr-only">{collapsed ? "Expand" : "Collapse"}</span>
                    </button>*/}

                    <div className="card-body">
                        <div className="row">
                            <div className="col-3 col-sm-3 col-md-3">
                                <h4 className="card-title">Vehicles</h4>

                                <div className="icon-wrap icon-vehicle">
                                    <span className="icon"><img
                                        src={car2}
                                        alt="Vehicles on the road"
                                        height="18"/></span>
                                    <span className="badge badge-light info-value">{Math.max(vehicles1.length,vehicles2.length)}</span>
                                </div>

                                <div className="info-group container-fluid">
                                    <div className="row">
                                        <div className="col-9">On road:</div>
                                        <div className="col-3 text-right info-value">{Math.max(vehicles1.length,vehicles2.length)}</div>
                                    </div>
                                    <div className="row">
                                        <div className="col-9">Avg. speed:</div>
                                        <div className="col-3 text-right info-value">0</div>
                                    </div>
                                    {/*<div className="row">
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
                                    </div>*/}
                                </div>
                            </div>
                            <div className="col-3 col-sm-3 col-md-3">
                                <h4 className="card-title">Shelters</h4>

                                <div className="icon-wrap icon-shelter">
                                    <span className="icon">
                                        <ShelterOpen />
                                    </span>
                                    <span className="badge badge-light info-value">0</span>
                                </div>

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
                                            {/*<img
                                                src={shelter_full}
                                                alt="Shelter has no available space"
                                                height="12"/>*/}<span className="icon"><ShelterFull /></span> Full
                                        </div>
                                        <div className="col-7 text-right">
                                            {/*<img
                                                src={shelter_open}
                                                alt="Available shelter"
                                                height="12"/>*/}<span className="icon"><ShelterOpen /></span> Available
                                        </div>
                                    </div>
                                    {/*<div className="row">
                                        <div className="col-2">
                                            <img
                                                src={shelter_full}
                                                alt="Shelter has no available space"
                                                height="12"/><ShelterFull />
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
                                                height="12"/><ShelterOpen />
                                        </div>
                                    </div>*/}
                                </div>
                            </div>
                            <div className="col-3 col-sm-3 col-md-3">
                                <h4 className="card-title">Selected Link</h4>

                                <div className="icon-wrap icon-road">
                                    <span className="icon">
                                        <Road />
                                    </span>
                                    <span className="badge badge-light info-value">{selected_link ? selected_link.Id : '--'}</span>
                                </div>

                                <div className="info-group container-fluid">
                                    <div className="row"><div className="col-6">Link ID:</div><div className="col-6 text-right info-value">{selected_link ? selected_link.Id : '--'}</div></div>
                                    <div className="row"><div className="col-7">Link length:</div><div className="col-5 text-right info-value">{selected_link ? selected_link.length.toFixed(1) : 0} m</div></div>
                                    <div className="row"><div className="col-7">Speed limit:</div><div className="col-5 text-right info-value">{selected_link ? selected_link.freeflowsp : 0} km/h</div></div>
                                </div>
                            </div>
                            <div className="col-3 col-sm-3 col-md-3">
                                <h4 className="card-title">Selected Vehicle</h4>

                                <div className="icon-wrap icon-selected">
                                    <span className="icon"><img
                                        src={car4}
                                        alt="Selected vehicle"
                                        height="18"/></span>
                                    <span className="badge badge-light info-value">{selected_vehicle ? selected_vehicle.id : '--'}</span>
                                </div>

                                <div className="info-group container-fluid">
                                    <div className="row"><div className="col-7">Vehicle ID:</div><div className="col-5 text-right info-value">{selected_vehicle ? selected_vehicle.id : '--'}</div></div>
                                    <div className="row"><div className="col-9">Origin:</div><div className="col-3 text-right">
                                        <span className="icon">{/*<img
                                            src={red_pin}
                                            alt="Origin pin"
                                            height="12"/>*/}<PinOrigin /></span>
                                    </div></div>
                                    <div className="row"><div className="col-9">Destination:</div><div className="col-3 text-right">
                                        <span className="icon">{/*<img
                                            src={blue_pin}
                                            alt="Destination pin"
                                            height="12"/>*/}<PinDestination /></span>
                                    </div></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
    }
}
