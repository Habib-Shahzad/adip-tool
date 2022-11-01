import React from 'react';
import './Home.css';


function Home() {
    return (
        <div className='home-container'>
            <div className="text-container ">
                <div className="glitch" data-text="Welcome">Welcome</div>
                <div className="glow">Welcome</div>
            </div>
            <div className="scanlines"></div>
        </div>
    )
}

export default Home
