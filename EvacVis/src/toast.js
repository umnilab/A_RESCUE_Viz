import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const Toast = props => {
    const { toastList, position, autoDelete, dismissTime } = props;
    const [list, setList] = useState(toastList);

    useEffect(() => {
        setList([...toastList]);
        //this.setState({messages: [...toastList]});

        // eslint-disable-next-line
    }, [toastList]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (autoDelete && toastList.length && list.length) {
                console.log('Deleting toast');
                deleteToast(toastList[0].id);
            }
        }, dismissTime);
        
        return () => {
            clearInterval(interval);
        }

        // eslint-disable-next-line
    }, [toastList, autoDelete, dismissTime, list]);

    const deleteToast = id => {
        const listItemIndex = list.findIndex(e => e.id === id);
        const toastListItem = toastList.findIndex(e => e.id === id);
        list.splice(listItemIndex, 1);
        toastList.splice(toastListItem, 1);
        setList([...list]);
        //this.setState({messages: [...list]});
    }

    return (
            <div className={`notification-container ${position}`}>
                {
                    list.map((toast, i) =>
                        <div 
                            key={i}
                            className={`notification toast ${position} ${toast.type}`}
                        >
                            <button onClick={() => deleteToast(toast.id)}>
                                &times;
                            </button>
                            <div>
                                <p className="notification-title">{toast.title}</p>
                                <p className="notification-message">
                                    {toast.description}
                                </p>
                            </div>
                        </div>
                    )
                }
            </div>
    );
}

Toast.propTypes = {
    toastList: PropTypes.array.isRequired,
    position: PropTypes.string,
    autoDelete: PropTypes.bool,
    dismissTime: PropTypes.number
}

export default Toast;
