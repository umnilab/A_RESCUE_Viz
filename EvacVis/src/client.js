import {clientControl} from "./style";
import React, { Component } from 'react';


export class Client extends Component{
    constructor(props) {
        super(props);
        this.state = {
            address: "tnet1.ecn.purdue.edu:47906",
            hist_addr:"http://localhost:8080/test_data/", //"https://engineering.purdue.edu/HSEES/test/instance_0/",
            message: "",
            max_tick: 10
        }
        this.upDateAddress = this.upDateAddress.bind(this);
        this.upDateMess = this.upDateMess.bind(this);
        this.upDateHist = this.upDateHist.bind(this);
        this.fillMesageCreate = this.fillMesageCreate.bind(this);
        this.fillMessageStart = this.fillMessageStart.bind(this);
        this.toggleConfigDialog = this.toggleConfigDialog.bind(this);
        this.fillMessageConfig = this.fillMessageConfig.bind(this);
        this.updateConfigOptions = this.updateConfigOptions.bind(this);
        this.processConfigDialog = this.processConfigDialog.bind(this);
        this.toggleEventDialog = this.toggleEventDialog.bind(this);
        this.processEventDialog = this.processEventDialog.bind(this);
        this.fillMessageEvent = this.fillMessageEvent.bind(this);
    }

    upDateAddress(){
        this.setState({address: document.getElementsByName("addr_txt")[0].value})
    }

    upDateMess(){
        this.setState({message: document.getElementsByName("send_txt")[0].value})
    }

    upDateHist(){
        this.setState({hist_addr: document.getElementsByName("hist_txt")[0].value})
    }

    fillMesageCreate(){
        document.getElementsByName("send_txt")[0].value = "CREATE";
    }

    fillMessageStart(){
        document.getElementsByName("send_txt")[0].value = "START";
    }

    toggleConfigDialog() {
        this.updateConfigOptions(this.props.options);
        //let d = document.getElementsByName("config_dialog")[0];

        //this.setState({dialog: this.state.dialog ? false : true});

        let d = document.getElementById('app-tabContent');
        if (d.classList.contains('dialog-config')) {
            d.classList.remove('dialog-config');
        } else {
            d.classList.add('dialog-config');
        }

        /*if (d.style.display === "none") {
            d.style.display = "block";
        }
        else {
            d.style.display = "none";
        }*/
    }

    toggleEventDialog() {
        let d = document.getElementById('app-tabContent');
        if (d.classList.contains('dialog-event')) {
            d.classList.remove('dialog-event');
        } else {
            d.classList.add('dialog-event');
        }
        /*let d = document.getElementsByName("event_dialog")[0];

        if (d.style.display === "none") {
            d.style.display = "block";
        }
        else {
            d.style.display = "none";
        }*/
    }

    fillMessageConfig() {
        // build the message which will be placed in the send message box
        let template = "CONFIG\n";

        let user_name = document.getElementsByName("config_name")[0].value;
        let user_demand = document.getElementsByName("config_demand")[0].value;
        let user_event = document.getElementsByName("config_event")[0].value;
        let user_routing = document.getElementsByName("config_routing")[0].value;
        let user_ticks = document.getElementsByName("config_ticks")[0].value;

        var user_options = {};

        if (user_name && user_name !== "") {
            user_options["name"] = user_name;
        }

        if (user_demand && user_demand !== "") {
            user_options["demand"] = user_demand;
        }

        if (user_event && user_event !== "") {
            user_options["event"] = user_event;
        }

        if (user_routing && user_routing !== "") {
            user_options["routing"] = user_routing;
        }

        if (user_ticks && user_ticks !== "") {
            user_options["ticks"] = user_ticks;
        }

        template += JSON.stringify(user_options);

        // set the constructed message in the text field
        document.getElementsByName("send_txt")[0].value = template;
    }

    fillMessageEvent() {
        // build the message which will be placed in the send message box
        let template = "EVENT\n";

        let user_linkid = document.getElementsByName("select_link")[0].value;
        let user_stime = document.getElementsByName("start_time")[0].value;
        let user_etime = document.getElementsByName("end_time")[0].value;
        let user_value1 = document.getElementsByName("value1")[0].value;
        let user_value2 = document.getElementsByName("value2")[0].value;

        var user_options = {};

        if (user_linkid && user_linkid !== "") {
            user_options["link"] = user_linkid;
        }

        if (user_stime && user_stime !== "") {
            user_options["start_time"] = user_stime;
        }

        if (user_etime && user_etime !== "") {
            user_options["end_time"] = user_etime;
        }

        if (user_value1 && user_value1 !== "") {
            user_options["value1"] = user_value1;
        }

        if (user_value2 && user_value2 !== "") {
            user_options["value2"] = user_value2;
        }

        template += JSON.stringify(user_options);

        // set the constructed message in the text field
        document.getElementsByName("send_txt")[0].value = template;
    }

    updateConfigOptions(options) {
        // parse the name field options
        let nameOption = options["name"];
        let nameInput = document.getElementsByName("config_name")[0];

        // parse the demand file options
        let demandOption = options["demand"];
        let demandInput = document.getElementsByName("config_demand")[0];

        let demands = demandOption["options"];
        for (let i = 0; i < demands.length; i++) {
            let d = document.createElement("option");
            d.appendChild( document.createTextNode(demands[i]) );
            d.value = demands[i];

            demandInput.appendChild(d);
        }

        // parse the event file options
        let eventOption = options["event"];
        let eventInput = document.getElementsByName("config_event")[0];

        let events = eventOption["options"];
        for (let j = 0; j < events.length; j++) {
            let e = document.createElement("option");
            e.appendChild( document.createTextNode(events[j]) );
            e.value = events[j];

            eventInput.appendChild(e);
        }

        // parse the routing algorithm options
        let routingOption = options["routing"];
        let routingInput = document.getElementsByName("config_routing")[0];

        let algorithms = routingOption["options"];
        for (let k = 0; k < algorithms.length; k++) {
            let a = document.createElement("option");
            a.appendChild( document.createTextNode(algorithms[k]) );
            a.value = algorithms[k];

            routingInput.appendChild(a);
        }

        // parse the simulation length options
        let tickOption = options["ticks"];
        console.log(tickOption);
        let tickInput = document.getElementsByName("config_ticks")[0];
        // let tickValue = document.getElementsByName("tick_value")[0];
        console.log(tickInput);

        let minTick = tickOption["minimum"];
        let maxTick = tickOption["maximum"];
        let tickStep = tickOption["step"];
        let defaultTick = tickOption["default"];

        tickInput.min = minTick;
        tickInput.max = maxTick;
        tickInput.step = tickStep;
        tickInput.value = defaultTick;
        this.setState({max_tick:defaultTick});

        console.log(minTick + "," + maxTick + "," + tickStep + "," + defaultTick);
    }

    processConfigDialog() {
        // fill the text box with configuration
        this.fillMessageConfig();

        // hide the configuration dialog box
        this.toggleConfigDialog();
    }

    processEventDialog(){
        this.fillMessageEvent();
        this.toggleEventDialog();
    }

    render() {
        const {connected, synchronized, connectServer, disConnectServer, sendMessage, loadHistory, synchronizeController, releaseController, maximal_time} = this.props;
        const {message, address, hist_addr,max_tick} = this.state;
        if (connected) {
            if (synchronized) {
                return(
                    <div className="app-connection connection-controls card connected synchronized" id="app-connection">
                        <div className="card-header">
                            <div className="row">
                                <div className="col-md-6">
                                    <span className="sr-only">Status: </span>
                                    <span className="status status-success">Connected</span>
                                </div>
                                <div className="col-md-6 text-right">
                                    <button className="btn btn-sm btn-danger" onClick={disConnectServer}>Disconnect</button>
                                </div>
                            </div>
                        </div>
                        <div className="card-body">
                            <form name="template_form" className="hide-dialog-config hide-dialog-event">
                                <div className="form-group">
                                    <div className="input-group">
                                        <label className="input-group-prepend"><span className="input-group-text">Simulation time:</span></label>
                                        <input type="text" className="form-control" name="max_time" disabled="disabled"/>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <div className="input-group">
                                        <label className="input-group-prepend"><span className="input-group-text">Selected link:</span></label>
                                        <input type="text" className="form-control" name="select_link" disabled="disabled"/>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="btn-group">
                                                <input type="button" name="event_btn" className="btn btn-secondary" disabled={false} value="Event"
                                                        onClick={this.toggleEventDialog} />
                                            </div>
                                        </div>
                                        <div className="col-md-6 text-right">
                                            <input type="button" name="desynchronize_btn" className="btn btn-secondary" disabled={false} value="Desynchronize"
                                                    onClick={releaseController} />
                                        </div>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="sr-only" htmlFor="send_txt">Message</label>
                                    <textarea name="send_txt" id="send_txt" className="form-control" onChange={this.upDateMess}/>
                                </div>
                                <div className="form-group">
                                    <input type="button" name="send_btn" className="btn btn-primary" value="Send"
                                           onClick={sendMessage}/>
                                </div>
                            </form>
                            <dialog name="event_dialog">
                                <form name="event_parameters">
                                    <fieldset>
                                        <legend className="card-title">Event Configuration</legend>
                                        <p className="form-text">Configure the event.</p>
                                        <div className="form-group">
                                            <label className="start_time">Start Time:</label>
                                            <input type="text" className="form-control" name="start_time" id="start_time"/>
                                        </div>
                                        <div className="form-group">
                                            <label className="end_time">End Time:</label>
                                            <input type="text" className="form-control" name="end_time" id="end_time"/>
                                        </div>
                                        <div className="form-group">
                                            <label className="value1">Value 1:</label>
                                            <input type="text" className="form-control" name="value1" id="value1"/>
                                        </div>
                                        <div className="form-group">
                                            <label className="value2">Value 2:</label>
                                            <input type="text" className="form-control" name="value2" id="value2"/>
                                        </div>
                                        <div className="form-group">
                                            <label className="type">Type:</label>
                                            <select className="form-control" name="type" id="type">
                                                <option value="1">Road blockage</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <input type="button" className="btn btn-primary" name="set_event" value="Accept" onClick={this.processEventDialog}/>
                                            <input type="button" className="btn btn-link float-right" name="cancel_event" value="Cancel" onClick={this.toggleEventDialog}/>
                                        </div>
                                    </fieldset>
                                </form>
                            </dialog>
                        </div>
                    </div>
                )
            }
            else{
                return (
                    <div className="app-connection connection-controls card connected unsynchronized" id="app-connection">
                        <div className="card-header">
                            <div className="row">
                                <div className="col-md-6">
                                    <span className="sr-only">Status: </span>
                                    <span className="status status-success">Connected</span>
                                </div>
                                <div className="col-md-6 text-right">
                                    <button className="btn btn-sm btn-danger" onClick={disConnectServer}>Disconnect</button>
                                </div>
                            </div>
                        </div>
                        <div className="card-body">
                            <form name="template_form" className="hide-dialog-config hide-dialog-event">
                                <div className="form-group">
                                    <div className="input-group">
                                        <label className="input-group-prepend"><span className="input-group-text">Simulation time:</span></label>
                                        <input type="text" className="form-control" name="max_time" disabled="disabled"/>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <div className="row">
                                        <div className="col-md-7">
                                            <div className="btn-group">
                                                <input type="button" name="config_btn" className="btn btn-secondary" disabled={false} value="Config"
                                                       onClick={this.toggleConfigDialog} />
                                            </div>
                                        </div>
                                        <div className="col-md-5 text-right">
                                            <input type="button" name="synchronize_btn" className="btn btn-secondary" disabled={false} value="Synchronize"
                                                   onClick={synchronizeController} />
                                        </div>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="sr-only" htmlFor="send_txt">Message</label>
                                    <textarea name="send_txt" id="send_txt" className="form-control" onChange={this.upDateMess}/>
                                </div>
                                <div className="form-group">
                                    <div className="row">
                                        <div className="col-md-5">
                                            <input type="button" name="send_btn" className="btn btn-primary" value="Send"
                                                onClick={sendMessage}/>
                                        </div>
                                        <div className="col-md-7 text-right">
                                           <div className="btn-group">
                                                <input type="button" name="create_btn" className="btn btn-link" disabled={false} value="Create"
                                                       onClick={this.fillMesageCreate} />
                                                <input type="button" name="start_btn" className="btn btn-link" disabled={false} value="Start"
                                                       onClick={this.fillMessageStart} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                            <dialog name="config_dialog">
                                <form name="simulation_parameters">
                                    <fieldset>
                                        <legend className="card-title">Simulation Configuration</legend>
                                        <p className="form-text">Configure the parameters of the simulation.</p>
                                        <div className="form-group">
                                            <label htmlFor="config_name">Name:</label>
                                            <input type="text" className="form-control" name="config_name" id="config_name" />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="config_demand">Demand File:</label>
                                            <select className="form-control" name="config_demand" id="config_demand"></select>
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="config_event">Event File:</label>
                                            <select className="form-control" name="config_event" id="config_event"></select>
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="config_routing">Routing Algorithm:</label>
                                            <select className="form-control" name="config_routing" id="config_routing"></select>
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="config_ticks">Simulation Length:</label>
                                            <span className="badge badge-light"><span name="tick_value">{max_tick}</span></span>
                                            <input type="range" className="custom-range" name="config_ticks" id="config_ticks" min="1" max="10" step="1"
                                                             onChange={
                                                                 e => this.setState({max_tick: e.target.value}, ()=> console.log(this.state.max_tick))}/>
                                        </div>
                                        <div className="form-group">
                                            <input type="button" className="btn btn-primary" name="set_config" value="Accept" onClick={this.processConfigDialog}/>
                                            <input type="button" className="btn btn-link float-right" name="cancel_config" value="Cancel" onClick={this.toggleConfigDialog}/>
                                        </div>
                                    </fieldset>
                                </form>
                            </dialog>
                        </div>
                    </div>
                );
            }
        } else {
            return (
                <div className="app-connection connection-controls offline active" id="app-connection">
                    <div className="card">
                    <div className="card-header">
                        <span className="sr-only">Status: </span><span className="status status-danger">Offline</span> 
                    </div>
                    <div className="card-body">
                        <div className="form-group">
                            <label htmlFor="addr_txt">Connection</label>
                            <div className="input-group">
                                <input type="text" className="form-control" name="addr_txt" id="addr_txt" value={address} onChange={this.upDateAddress}/>
                                <span className="input-group-append">
                                    <button className="btn btn-primary" onClick={connectServer}>Connect</button>
                                </span>
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="hist_txt">History</label>
                            <div className="input-group">
                                <input type="text" className="form-control" name="hist_txt" id="hist_txt" value={hist_addr} onChange={this.upDateHist}/>
                                <span className="input-group-append"><button className="btn btn-secondary" name="load_his" value="Load"
                                       onClick={loadHistory}><span className="spinner spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Load</button></span>
                            </div>
                        </div>
                    </div>
                    </div>
                </div>
            );
        }
    }
}
