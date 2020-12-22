// Modified based on https://vis.academy/#/building-a-geospatial-app/4-a-basic-chart

import React, { Component } from 'react';
import { LineSeries, FlexibleXYPlot, XAxis, YAxis, DiscreteColorLegend } from 'react-vis';
//import { max } from "d3";
import PropTypes from 'prop-types';

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
        //document.resize();
    }

    render() {
        const { plotdata2, roads, roadData } = this.props;//plotdata, plotdata2

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

        // Gather some road data
        const roadspeed = new Map();
        const linkdict = new Map();
        roads.forEach((value,key) => {
            roadspeed.set(key, value.speed);
        });

        let rows = [], topten;

        if(roadData['features'] != null){
            for (var i = 0; i < roadData['features'].length; i++) {
                linkdict.set(roadData['features'][i]['properties']['Id'], roadData['features'][i]['properties']['length']);
            }
            // Sort by road speed and take the top N items
            const roadspeedSorted = new Map([...roadspeed.entries()].sort((a, b) => b[1] - a[1]));

            //console.log(roadspeedSorted);

            topten = Array.from(roadspeedSorted).slice(0, 6);
            topten.forEach((item, key) => {
                rows.push(
                    <tr key={item[0]}>
                        <td>{item[0]}</td>
                        <td className="text-right">{linkdict.get(item[0]).toFixed(1)} m</td>
                        <td className="text-right">{(item[1] > 0 ? (item[1]*2.2374).toFixed(1) : 0)} mph</td>
                    </tr>
                );
            });
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
        let arrivedy = Math.max(1200, (plotdata2.totals.length ? plotdata2.arrived[plotdata2.totals.length-1] : 0));
        //console.log('Arrived counts:');
       // console.log(arrivedy);

        const totaldata = plotdata2.ticks.map((k, i) => ({tick: Number(k), x: Number(k), y: plotdata2.totals[i]}));

        let className = collapsed ? "chart-panel card collapsed" : "chart-panel card expanded";

        return (
            <div className={className}>
                <button className="btn btn-minimize" onClick={this.togglePanel} data-tip={collapsed ? "Expand" : "Collapse"}>
                    <span className="icon-chevron"></span><span className="sr-only">{collapsed ? "Expand" : "Collapse"}</span>
                </button>
                <div className="card">
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-8">
                                <h2 className="card-title">Distribution Plots</h2>

                                <div className="chart-container">
                                    <FlexibleXYPlot
                                        margin={{ left: 45, right: 0, top: 10, bottom: 25 }}
                                        yDomain={[0,arrivedy]}
                                    >
                                        {!collapsed && <YAxis title="Vehicle number"/>}
                                        {collapsed && <YAxis title="" tickValues={[0,arrivedy]}/>}
                                        <LineSeries
                                            style={{strokeLinejoin: "round"}}
                                            color="#ff6865"
                                            data={totaldata}
                                        />
                                        <LineSeries
                                            style={{strokeLinejoin: "round"}}
                                            color="#8ae8ff"
                                            data={vehicledata}
                                        />
                                        <LineSeries
                                            style={{strokeLinejoin: "round"}}
                                            color="#9aba45"
                                            data={arriveddata}
                                        />
                                        <XAxis title={collapsed ? "" : "Ticks"}/>
                                        <DiscreteColorLegend orientation="horizontal" items={[{title: 'Vehicles on road', color: '#8ae8ff'}, {title: 'Destination reached', color: '#9aba45'}, {title: 'Evacuation demand', color: '#ff6865'}]}/>
                                    </FlexibleXYPlot>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <h2 className="card-title">Fastest Roads</h2>
                                <div className="info-groups">
                                <table className="table table-hover table-bordered">
                                    <caption className="sr-only">Fastest 10 roads</caption>
                                    <thead>
                                        <tr>
                                            <th scope="col">Road ID</th>
                                            <th scope="col" className="text-right">Length</th>
                                            <th scope="col" className="text-right">Speed</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows}
                                    </tbody>
                                </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

Chart.propTypes = {
    plotdata2: PropTypes.object
}
