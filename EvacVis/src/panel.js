import {panel} from "./style";
import React, { Component } from 'react';
import red_pin from "../res/pin_red.png";
import blue_pin from "../res/pin_blue.png";


export class Panel extends Component{

    render(){
        const {vehicles1, vehicles2, selected_vehicle, selected_link} = this.props;
        if(selected_link && selected_vehicle){
            return(
                <div style={panel}>
                    <div> Vehicles on road: {Math.max(vehicles1.length,vehicles2.length)} </div>
                    <div> ------------------------------------------</div>
                    <div> Selected vehicle id: {selected_vehicle.id} </div>
                    <div> Origin:
                        <img
                            src={red_pin}
                            alt={"Red Pin"}
                            width="20"
                            height="20"/>
                        Destination: <img
                            src={blue_pin}
                            alt={"Blue Pin"}
                            width="20"
                            height="20"/> </div>
                    <div> ------------------------------------------</div>
                    <div> Selected link id: {selected_link.Id} </div>
                    <div> Link length: {selected_link.length.toFixed(1)} m</div>
                    <div> Speed limit: {selected_link.freeflowsp} km/h</div>
                </div>
            );
        }
        else if(selected_vehicle){
            return(
                <div style={panel}>
                    <div> Vehicles on road: {Math.max(vehicles1.length,vehicles2.length)} </div>
                    <div> -----------------------------------------</div>
                    <div> Selected vehicle id: {selected_vehicle.id} </div>
                    <div> Origin:
                        <img
                            src={red_pin}
                            alt={"Red Pin"}
                            width="20"
                            height="20"/>
                        Destination: <img
                            src={blue_pin}
                            alt={"Blue Pin"}
                            width="20"
                            height="20"/> </div>
                </div>
            );
        }
        else if(selected_link){
            return(
                <div style={panel}>
                    <div> Vehicles on road: {Math.max(vehicles1.length,vehicles2.length)} </div>
                    <div> -----------------------------------------</div>
                    <div> Selected link id: {selected_link.Id} </div>
                    <div> Link length: {selected_link.length.toFixed(1)} m</div>
                    <div> Speed limit: {selected_link.freeflowsp} km/h</div>
                </div>
            );
        }
        else{
            return(
                <div style={panel}>
                    <div> Vehicles on road: {Math.max(vehicles1.length,vehicles2.length)} </div>
                </div>
            );
        }
    }
}
