import React, { useEffect, useState } from 'react';

type player = {
    resume: () => void;
    pause: () => void;
};

export default function Player(props: { token: string }) {
    const [player, setPlayer] = useState(null as player | null);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        if (!props.token) return;
        const spotifyPlayer = new window.Spotify.Player({
            name: 'Web Playback SDK',
            getOAuthToken: cb => { cb(props.token); }
        });

        // Error handling
        spotifyPlayer.addListener('initialization_error', ({ message }) => { console.error(message); });
        spotifyPlayer.addListener('authentication_error', ({ message }) => { console.error(message); });
        spotifyPlayer.addListener('account_error', ({ message }) => { console.error(message); });
        spotifyPlayer.addListener('playback_error', ({ message }) => { console.error(message); });

        // Playback status updates
        spotifyPlayer.addListener('player_state_changed', state => {
            console.log(state);
            setIsPlaying(!state.paused);
        });

        // Ready
        spotifyPlayer.addListener('ready', ({ device_id }) => {
            console.log('Ready with Device ID', device_id);
        });

        // Not Ready
        spotifyPlayer.addListener('not_ready', ({ device_id }) => {
            console.log('Device ID has gone offline', device_id);
        });

        // Connect to the player!
        spotifyPlayer.connect().then(success => {
            if (success) {
                console.log('Connected to Spotify Player');
                setPlayer(spotifyPlayer);
            }
        });
    }, [props.token]);

    const togglePlay = () => {
        if (!isPlaying) {
            player?.resume();
        } else {
            player?.pause();
        }
    };

    return (
        <div>
            <button onClick={togglePlay}>
                {isPlaying ? 'Pause' : 'Play'}
            </button>
        </div>
    );
}
