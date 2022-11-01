import React from 'react';
import { BouncyText } from '../../components';
import './About.css';

function About() {
    return (
        <div className='about-container'>
            <div className='margin-global-top-2' />
            <div className='margin-global-top-2' />
            <h1>Developers</h1>
            <div className='about-text-container'>
                <BouncyText
                    text='Habib Shahzad'
                />
                <BouncyText
                    classes='margin-top'
                    text="Akeel Ather Medina"
                />
            </div>
        </div>
    )
}

export default About
