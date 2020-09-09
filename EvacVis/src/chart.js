// Modified based on https://vis.academy/#/building-a-geospatial-app/4-a-basic-chart

import React from 'react';
import { charts } from './style';

import { LineSeries, VerticalBarSeries, XAxis, XYPlot, YAxis } from 'react-vis';
import {max} from "d3";

export default function Chart({plotdata, plotdata2}) {

    if(!plotdata){
        return (<div style={charts} />);
    }

    console.log(plotdata2);
    // const data = plotdata.hour.map((k, i) => ({hour: Number(k), x: Number(k)+1, x0: Number(k) + 0, y: plotdata.counts[i], y0: 0}));
    const data = plotdata2.ticks.map((k, i) => ({tick: Number(k), x: Number(k), y: plotdata2.counts[i]}));
    console.log(data)

    return (
            <div className="chart-panel card">
                <div className="card-body">
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
                <h2>Vehicles on road</h2>
                <XYPlot
                    margin={{ left: 40, right: 25, top: 10, bottom: 25 }}
                    height={200}
                    width={400}
                    yDomain={[0,1200]}
                >
                    <YAxis title="Vehicle number"/>
                    <LineSeries
                        style={{strokeLinejoin: "round"}}
                        data={data}
                    />
                    <XAxis title="Ticks"/>
                </XYPlot>
                </div>
            </div>
        );
}