import {legend} from "./style";
import React, { Component } from 'react';
import * as d3 from "d3";
import { legendColor } from 'd3-svg-legend'


export class Legend extends Component{
    render(){
        var ordinal = d3.scaleOrdinal()
            .domain(["<10", "[10,20)", "[20,30)", ">=30"])
            .range([ "rgb(211, 0, 0)", "rgb(211, 84, 0)", "rgb(247, 210, 76)", "rgb(112, 247, 76)"]);

        var svg = d3.select("svg");

        svg.append("g")
            .attr("class", "legendOrdinal");
            //.attr("transform", "translate(20,20)");

        var legendOrdinal = legendColor()
        //d3 symbol creates a path-string, for example
        //"M0,-8.059274488676564L9.306048591020996,
        //8.059274488676564 -9.306048591020996,8.059274488676564Z"
            .shapeWidth(50)
            .shapeHeight(5)
            .cells(4)
            .orient("horizontal")
            .scale(ordinal)

        svg.select(".legendOrdinal")
            .call(legendOrdinal);

        return(
            <div className="legend-panel card">
                <div className="card-body">
                Legend (km/h)
                <svg height="25" width="350" id="svg-color-oridnal">
                </svg>
                </div>
            </div>
        );}
}
