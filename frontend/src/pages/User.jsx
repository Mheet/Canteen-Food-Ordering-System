import React from 'react';

const User = () => {
    return (
        <div>
            <nav className="flex items-center justify-between bg-gray-800 p-4">
                <div>
                    <h1>Logo</h1>
                </div>
                <div className="md:block">
                    <ul className="flex space-x-4">
                        <li>
                            <a href="#">Home</a>
                        </li>
                        <li>
                            <a href="#">About</a>
                        </li>
                        <li>
                            <a href="#">Menu</a>
                        </li>
                    </ul>
                </div>
            </nav>
            <h1>Hello from user</h1>
        </div>
    );
};

export default User;