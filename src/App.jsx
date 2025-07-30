// src/App.jsx

import React, { useState } from 'react';
import {
    startRegistration,
    startAuthentication,
} from '@simplewebauthn/browser';

// Base URL for your backend server
const API_URL = 'http://localhost:3000';

function App() {
    const [username, setUsername] = useState('');
    const [message, setMessage] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const setFlashMessage = (msg, isError = false) => {
        setMessage({ text: msg, type: isError ? 'error' : 'success' });
        setTimeout(() => setMessage(''), 3000);
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!username) {
            setFlashMessage('Please enter a username', true);
            return;
        }

        try {
            // 1. Get registration options from the server
            const optionsRes = await fetch(`${API_URL}/generate-registration-options?username=${username}`);
            const options = await optionsRes.json();
            if (options.error) {
                throw new Error(options.error);
            }

            // 2. Pass options to WebAuthn browser API
            const registrationResponse = await startRegistration(options);

            // 3. Send response to server for verification
            const verificationRes = await fetch(`${API_URL}/verify-registration`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, response: registrationResponse }),
            });
            const verificationJSON = await verificationRes.json();

            if (verificationJSON && verificationJSON.verified) {
                setFlashMessage('Registration successful! You can now log in.');
            } else {
                throw new Error(verificationJSON.error || 'Verification failed.');
            }
        } catch (error) {
            setFlashMessage(error.message || 'Registration failed.', true);
            console.error(error);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!username) {
            setFlashMessage('Please enter your username', true);
            return;
        }

        try {
            // 1. Get authentication options from the server
            const optionsRes = await fetch(`${API_URL}/generate-authentication-options?username=${username}`);
            const options = await optionsRes.json();
            if (options.error) {
                throw new Error(options.error);
            }

            // 2. Pass options to WebAuthn browser API
            const authResponse = await startAuthentication(options);

            // 3. Send response to server for verification
            const verificationRes = await fetch(`${API_URL}/verify-authentication`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, response: authResponse }),
            });
            const verificationJSON = await verificationRes.json();

            if (verificationJSON && verificationJSON.verified) {
                setIsLoggedIn(true);
                setFlashMessage('Login successful!');
            } else {
                throw new Error(verificationJSON.error || 'Authentication failed.');
            }
        } catch (error) {
            setFlashMessage(error.message || 'Login failed.', true);
            console.error(error);
        }
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setUsername('');
        setFlashMessage('You have been logged out.');
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 font-sans">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h1 className="text-3xl font-bold text-center text-gray-800">
                    WebAuthn Login
                </h1>

                {message && (
                    <div
                        className={`p-4 text-center rounded-md ${
                            message.type === 'error'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-green-100 text-green-700'
                        }`}
                    >
                        {message.text}
                    </div>
                )}

                {isLoggedIn ? (
                    <div className="text-center">
                        <p className="text-xl text-gray-600">Welcome, {username}!</p>
                        <button
                            onClick={handleLogout}
                            className="w-full px-4 py-2 mt-6 text-lg font-semibold text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition"
                        >
                            Log Out
                        </button>
                    </div>
                ) : (
                    <form className="space-y-6">
                        <div>
                            <label
                                htmlFor="username"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Enter your username"
                            />
                        </div>
                        <div className="flex space-x-4">
                            <button
                                onClick={handleRegister}
                                className="w-full px-4 py-2 text-lg font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition"
                            >
                                Register
                            </button>
                            <button
                                onClick={handleLogin}
                                className="w-full px-4 py-2 text-lg font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 transition"
                            >
                                Login
                            </button>
                        </div>
                    </form>
                )}
                <p className="text-xs text-center text-gray-500 mt-4">
                    Note: This demo uses in-memory storage. Server restarts will clear all data.
                </p>
            </div>
        </div>
    );
}

export default App;
