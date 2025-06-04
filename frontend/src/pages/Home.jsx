import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate=useNavigate();

    function navigateToLogin(){
        setTimeout(()=>{
            navigate('/login')
        },)
    
        
    }
    return (
        <div>
            <h1>Hello from home</h1>
            {/* Update the path to /login */}
            <button onClick={navigateToLogin}>login </button>
        </div>
    );
};

export default Home;
