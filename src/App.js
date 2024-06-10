import { useEffect, useState } from "react";
import './App.css';
import axios from 'axios';

function App() {
    const CLIENT_ID = "6b423790ef4f41bd8b7ea3ede5e47c17";
    const REDIRECT_URI = "http://localhost:3000";
    const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
    const RESPONSE_TYPE = "token";
    const SCOPE = "streaming user-read-email user-read-private user-modify-playback-state";

    const [token, setToken] = useState("");
    const [searchKey, setSearchKey] = useState("");
    const [artists, setArtists] = useState([]);
    const [player, setPlayer] = useState(undefined);

    useEffect(() => {
        const hash = window.location.hash;
        let token = window.localStorage.getItem("token");

        if (!token && hash) {
            token = hash.substring(1).split("&").find(elem => elem.startsWith("access_token")).split("=")[1];
            window.location.hash = "";
            window.localStorage.setItem("token", token);
        }

        setToken(token);

        if (token) {
            const script = document.createElement("script");
            script.src = "https://sdk.scdn.co/spotify-player.js";
            script.async = true;
            document.body.appendChild(script);

            window.onSpotifyWebPlaybackSDKReady = () => {
                const player = new window.Spotify.Player({
                    name: 'Spotify React App',
                    getOAuthToken: cb => { cb(token); },
                    volume: 0.5
                });

                setPlayer(player);

                player.addListener('ready', ({ device_id }) => {
                    console.log('Ready with Device ID', device_id);
                });

                player.addListener('not_ready', ({ device_id }) => {
                    console.log('Device ID has gone offline', device_id);
                });

                player.connect();
            };
        }
    }, [token]);

    const logout = () => {
        setToken("");
        window.localStorage.removeItem("token");
    };

    const searchArtists = async (e) => {
        e.preventDefault();
        const { data } = await axios.get("https://api.spotify.com/v1/search", {
            headers: {
                Authorization: `Bearer ${token}`
            },
            params: {
                q: searchKey,
                type: "artist"
            }
        });

        setArtists(data.artists.items);
    };

    const openSpotify = (uri) => {
        window.open(uri, '_blank');
    };

    const renderArtists = () => {
        return artists.map(artist => (
            <div className="artist" key={artist.id}>
                {artist.images.length > 0 && (
                    <img src={artist.images[0].url} alt={artist.name} />
                )}
                <div className="artist-overlay">
                    <div className="artist-info">
                        <div className="artist-name">{artist.name}</div>
                        <div className="track-name">{artist.topTrackName}</div>
                    </div>
                    <button className="play-button" onClick={() => openSpotify(artist.external_urls.spotify)}>
                        Play
                    </button>
                </div>
            </div>
        ));
    };

    return (
        <div className="App">
            <header className="App-header">
                <h1>Artist finder</h1>
                {!token ?
                    <a href={`${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=${SCOPE}`}>Login to Spotify</a>
                    : <button onClick={logout}>Logout</button>
                }

                {token ?
                    <form onSubmit={searchArtists}>
                        <input type="text" placeholder="Search for an artist..." onChange={e => setSearchKey(e.target.value)} />
                        <button type="submit">Search</button>
                    </form>
                    : <h2>Please login</h2>
                }

                <div className="artists">
                    {renderArtists()}
                </div>
            </header>
        </div>
    );
}

export default App;
