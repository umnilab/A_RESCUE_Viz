import {panel} from "./style";
import React, { Component } from 'react';
import red_pin from "../res/pin_red.png";
import blue_pin from "../res/pin_blue.png";


export class Panel extends Component{

    render(){
        const {vehicles1, vehicles2, selected_vehicle, selected_link} = this.props;
        if (selected_link && selected_vehicle) {
            return(
                <div className="info-panel card">
                    <div className="card-header">
                        <h4 className="card-title">Statistics</h4>
                    </div>
                    <div className="card-body">
                        <div className="row"><div className="col-6">Vehicles on road:</div><div className="col-6">{Math.max(vehicles1.length,vehicles2.length)}</div></div>
                        <div> ------------------------------------------</div>
                        <div className="row"><div className="col-6">Selected vehicle id:</div><div className="col-6 text-right">{selected_vehicle.id}</div></div>
                        <div className="row"><div className="col-6">Origin:</div><div className="col-6 text-right">
                            <img
                                src={red_pin}
                                alt={"Red Pin"}
                                width="20"
                                height="20"/>
                            Destination: <img
                                src={blue_pin}
                                alt={"Blue Pin"}
                                width="20"
                                height="20"/></div></div>
                        <div> ------------------------------------------</div>
                        <div className="row"><div className="col-6">Selected link id:</div><div className="col-6 text-right">{selected_link.Id}</div></div>
                        <div className="row"><div className="col-6">Link length:</div><div className="col-6 text-right">{selected_link.length.toFixed(1)} m</div></div>
                        <div className="row"><div className="col-6">Speed limit:</div><div className="col-6 text-right">{selected_link.freeflowsp} km/h</div></div>
                    </div>
                </div>
            );
        }
        else if (selected_vehicle) {
            return(
                <div className="info-panel card">
                    <div className="card-header">
                        <h4 className="card-title">Statistics</h4>
                    </div>
                    <div className="card-body">
                        <div className="row"><div className="col-6">Vehicles on road:</div><div className="col-6 text-right">{Math.max(vehicles1.length,vehicles2.length)} </div></div>
                        <div> -----------------------------------------</div>
                        <div className="row"><div className="col-6">Selected vehicle id:</div><div className="col-6 text-right">{selected_vehicle.id}</div></div>
                        <div className="row"><div className="col-6">Origin:</div><div className="col-6 text-right">
                            <img
                                src={red_pin}
                                alt={"Red Pin"}
                                width="20"
                                height="20"/>
                            Destination: <img
                                src={blue_pin}
                                alt={"Blue Pin"}
                                width="20"
                                height="20"/>
                        </div></div>
                    </div>
                </div>
            );
        }
        else if (selected_link) {
            return(
                <div className="info-panel card">
                    <div className="card-header">
                        <h4 className="card-title">Statistics</h4>
                    </div>
                    <div className="card-body">
                        <div className="row"><div className="col-6">Vehicles on road:</div><div className="col-6 text-right">{Math.max(vehicles1.length,vehicles2.length)}</div></div>
                        <div> -----------------------------------------</div>
                        <div className="row"><div className="col-6">Selected link id:</div><div className="col-6 text-right">{selected_link.Id}</div></div>
                        <div className="row"><div className="col-6">Link length:</div><div className="col-6 text-right">{selected_link.length.toFixed(1)} m</div></div>
                        <div className="row"><div className="col-6">Speed limit:</div><div className="col-6 text-right">{selected_link.freeflowsp} km/h</div></div>
                    </div>
                </div>
            );
        }
        else {
            return(
                <div className="info-panel card">
                    <div className="card-header">
                        <h4 className="card-title">Statistics</h4>
                    </div>
                    <div className="card-body">
                        <div className="row"><div className="col-6">Vehicles on road:</div><div className="col-6 text-right">{Math.max(vehicles1.length,vehicles2.length)}</div></div>
                    </div>
                </div>
            );
        }
    }
}
