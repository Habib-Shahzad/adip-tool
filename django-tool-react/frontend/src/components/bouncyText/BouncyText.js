import React from 'react';
import './BouncyText.css';

const BouncyText = (props) => {
    return (
        <h1 className={`bouncy-text ${props.classes}`}>{props.text}</h1>
    );
}

export default BouncyText;