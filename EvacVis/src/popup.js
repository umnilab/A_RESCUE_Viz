import React, { Component } from "react";

export class PopUp extends Component {
    handleClick = () => {
        this.props.sendControlMsg();
    };

    render() {
        return (
            <div className="modal">
                <div className="modal_content">
                    <span className="close" onClick={this.handleClick}>
                        &times;
                    </span>
                    <form>
                        <h3>Event!</h3>
                        <label>
                            Name:
                            <input type="text" name="name" />
                        </label>
                        <br />
                        <input type="submit" />
                    </form>
                </div>
            </div>
        );
    }
}
