// Modified based on https://vis.academy/#/building-a-geospatial-app/4-a-basic-chart

import React, { Component } from 'react';
import { charts } from './style';
import expand from "../res/chevron-up.svg";
import collapse from "../res/chevron-down.svg";
import { LineSeries, VerticalBarSeries, FlexibleXYPlot, XAxis, YAxis } from 'react-vis';
import {max} from "d3";

export class Chart extends Component {
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

    render() {
        const { plotdata, plotdata2 } = this.props;

        let collapsed = this.state.collapsed;

        if (!plotdata2) {
            return (
                <div className="chart-panel card">
                    <div className="card-header">
                        <h2 className="card-title">Distribution Plots</h2>
                    </div>
                    <div className="card-body">
                        No data found
                    </div>
                </div>
            );
        }
        // Raw data
        //console.log('Plotdata2:');
        //console.log(plotdata2);

        // Data for number of vehicles on the road
        // const data = plotdata.hour.map((k, i) => ({hour: Number(k), x: Number(k)+1, x0: Number(k) + 0, y: plotdata.counts[i], y0: 0}));
        const vehicledata = plotdata2.ticks.map((k, i) => ({tick: Number(k), x: Number(k), y: plotdata2.counts[i]}));
        //console.log('Vehicle counts:');
        //console.log(vehicledata);

        // Data for vehidles that reached destination
        const arriveddata = plotdata2.ticks.map((k, i) => ({tick: Number(k), x: Number(k), y: plotdata2.arrived[i]}));
        //console.log('Arrived counts:');
        //console.log(arriveddata);

        let className = collapsed ? "chart-panel card collapsed" : "chart-panel card expanded";

        return (
            <div className={className}>
                <button className="btn btn-minimize" onClick={this.togglePanel} data-tip={collapsed ? "Expand" : "Collapse"}>
                    <img
                      key="chart-panel-size"
                      src={collapsed ? expand : collapse}
                      alt={collapsed ? "Expand" : "Collapse"}
                      width="20"
                      height="20"/>
                </button>
                <div className="card">
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-4">
                                <h2 className="card-title">Vehicles on road</h2>
                                {/*<h2>Demand per hour</h2>*/}
                                {/*<XYPlot*/}
                                {/*    margin={{ left: 40, right: 25, top: 10, bottom: 25 }}*/}
                                {/*    height={200}*/}
                                {/*    width={400}*/}
                                {/*    yDomain={[0, 3000]}*/}
                                {/*>*/}
                                {/*    <YAxis />*/}
                                {/*    <VerticalBarSeries*/}
                                {/*        colorType="literal"*/}
                                {/*        data={data}*/}
                                {/*        style={{cursor: 'pointer'}}*/}
                                {/*    />*/}
                                {/*    <XAxis*/}
                                {/*        tickFormat={h =>*/}
                                {/*            h % 24 >= 12 ? (h % 12 || 12) + 'PM' : (h % 12 || 12) + 'AM'*/}
                                {/*        }*/}
                                {/*        tickSizeInner={0}*/}
                                {/*        tickValues={[0, 12, 24, 36, 48, 60, 72, 84]}*/}
                                {/*    />*/}
                                {/*</XYPlot>*/}
                                <div className="chart-container">
                                    <FlexibleXYPlot
                                        margin={{ left: 45, right: 0, top: 10, bottom: 25 }}
                                        yDomain={[0,1200]}
                                    >
                                        {!collapsed && <YAxis title="Vehicle number"/>}
                                        {collapsed && <YAxis title="" tickValues={[0,1200]}/>}
                                        <LineSeries
                                            style={{strokeLinejoin: "round"}}
                                            data={vehicledata}
                                        />
                                        <XAxis title={collapsed ? "" : "Ticks"}/>
                                    </FlexibleXYPlot>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <h2 className="card-title">Destination reached</h2>

                                <div className="chart-container">
                                    <FlexibleXYPlot
                                        margin={{ left: 45, right: 0, top: 10, bottom: 25 }}
                                        yDomain={[0,1200]}
                                    >
                                        {!collapsed && <YAxis title="Vehicle number"/>}
                                        {collapsed && <YAxis title="" tickValues={[0,1200]}/>}
                                        <LineSeries
                                            style={{strokeLinejoin: "round"}}
                                            data={arriveddata}
                                        />
                                        <XAxis title={collapsed ? "" : "Ticks"}/>
                                    </FlexibleXYPlot>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <h2 className="card-title">Evacuation demand</h2>

                                <div className="chart-container">
                                    <FlexibleXYPlot
                                        margin={{ left: 45, right: 0, top: 10, bottom: 25 }}
                                        yDomain={[0,1200]}
                                    >
                                        {!collapsed && <YAxis title="Vehicle number"/>}
                                        {collapsed && <YAxis title="" tickValues={[0,1200]}/>}
                                        <LineSeries
                                            style={{strokeLinejoin: "round"}}
                                            data={vehicledata}
                                        />
                                        <XAxis title={collapsed ? "" : "Ticks"}/>
                                    </FlexibleXYPlot>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };
}