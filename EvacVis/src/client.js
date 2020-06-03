import {clientControl} from "./style";
import React, { Component } from 'react';


export class Client extends Component{
    constructor(props) {
        super(props);
        this.state = {
            address: "tnet1.ecn.purdue.edu:47906",
            hist_addr:"https://engineering.purdue.edu/HSEES/gateway/1567198255960-ltest1/instance_0/",
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
        let d = document.getElementsByName("config_dialog")[0];

        if (d.style.display === "none") {
            d.style.display = "block";
        }
        else {
            d.style.display = "none";
        }
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

    updateConfigOptions(options) {
        // TODO: build the dialog box GUI for config completely dynamically

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
        // TODO: write configuration dialog box processing function
        this.fillMessageConfig();

        // hide the configuration dialog box
        this.toggleConfigDialog();
    }



    render() {
        const {connected, connectServer, disConnectServer, sendMessage, loadHistory, maximal_time} = this.props;
        const {message, address, hist_addr,max_tick} = this.state;
        if (connected) {
            return (
                <div style={clientControl}>
                    <form name="template_form">
                        <input type="button" name="create_btn" disabled={false} value="Create"
                               onClick={this.fillMesageCreate} style={{width: '80px'}}/><br/>
                        <input type="button" name="config_btn" disabled={false} value="Config"
                               onClick={this.toggleConfigDialog} style={{width: '80px'}}/><br/>
                        <input type="button" name="start_btn" disabled={false} value="Start"
                               onClick={this.fillMessageStart}
                               style={{width: '80px'}}/>
                    </form>
                    <div>
                        <textarea name="send_txt" onChange={this.upDateMess}/>
                        <input type="button" name="send_btn" value="Send"
                               onClick={sendMessage}/>
                    </div>
                    <div> Status: <b style={{color: "green"}}>Connected.</b> <u
                        onClick={disConnectServer}>(Disconnect)</u></div>
                    <div style={{float:"left"}}>
                        Simulation time: <input type="text" name="max_time" style={{width: '50px'}} disabled="disabled"/>
                    </div>
                    <dialog name="config_dialog" style={{display: "none"}}>
                        <p><strong><em>Configure the parameters of the simulation here:</em></strong></p>
                        <p>Name: <input type="text" name="config_name" style={{width: '250px'}}/></p>
                        <p>Demand File: <select name="config_demand"
                                                                          style={{width: '200px'}}/></p>
                        <p>Event File: <select name="config_event" style={{width: '250px'}}/></p>
                        <p>Routing Algorithm: <select name="config_routing" style={{width: '100px'}}/></p>
                        <p>Simulation Length: <input type="range" name="config_ticks" min="1" max="10" step="1"
                                                     style={{width: '175px'}}
                                                     onChange={
                                                     e => this.setState({max_tick: e.target.value}, ()=> console.log(this.state.max_tick))}/>
                        &nbsp; <span name="tick_value">{max_tick}</span></p>
                        <br/>
                        <input type="button" name="set_config" value="Accept" onClick={this.processConfigDialog}/>
                        <input type="button" name="cancel_config" value="Cancel" onClick={this.toggleConfigDialog}/>
                    </dialog>
                </div>
            );
        } else {
            return (
                <div style={clientControl}>
                    <div><input type="text" name="addr_txt" value={address} onChange={this.upDateAddress}/></div>
                    <div> Status: <b style={{color: "red"}}> Offline.</b> <u onClick={connectServer}> (Connect) </u>
                    </div>
                    <div>
                        <input type="text" name="hist_txt" value={hist_addr} onChange={this.upDateHist}/>
                        <input type="button" name="load_his" value="Load"
                               onClick={loadHistory}/>
                    </div>
                </div>
            );
        }
    }
}
