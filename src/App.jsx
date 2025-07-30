// src/App.jsx
import React, { useState } from 'react';
import {
    startRegistration,
    startAuthentication,
} from '@simplewebauthn/browser';

const API_URL = 'https://password-test-backend.vercel.app';

function App() {
    const [username, setUsername] = useState('');
    const [message, setMessage] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const setFlashMessage = (msg, isError = false) => {
        setMessage({ text: msg, type: isError ? 'error' : 'success' });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!username) return setFlashMessage('Please enter a username', true);

        try {
            const res = await fetch(`${API_URL}/generate-registration-options?username=${username}`);
            const options = await res.json();
            if (options.error) throw new Error(options.error);

            const registrationResponse = await startRegistration(options);

            const verifyRes = await fetch(`${API_URL}/verify-registration`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, response: registrationResponse }),
            });

            const verification = await verifyRes.json();

            if (verification.verified) {
                setFlashMessage('Registration successful! You can now log in.');
            } else {
                throw new Error(verification.error || 'Verification failed.');
            }
        } catch (err) {
            console.error(err);
            setFlashMessage(err.message || 'Registration failed.', true);
        }
    };


    const handleLogin = async (e) => {
        e.preventDefault();

        try {
   

            // 2. Get options WITH username
            const res = await fetch(`${API_URL}/generate-authentication-options?username=${encodeURIComponent(username)}`);
            const options = await res.json();
            if (options.error) throw new Error(options.error);

            // 3. Start authentication
            const authResponse = await startAuthentication(options);

            // 4. Verify - include username in body
            const verifyRes = await fetch(`${API_URL}/verify-authentication`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username, // Pass the username
                    response: authResponse
                }),
            });

            // ... rest remains same ...
        } catch (err) {
            setFlashMessage(err.message || 'Login failed', true);
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
                    WebAuthn Biometric Login
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
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                Username (for registration only)
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Enter username"
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
                                Login (Biometric)
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
