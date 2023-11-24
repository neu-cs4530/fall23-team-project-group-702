import { NextApiHandler } from "next";

let spotifyController: SpotifyPlayback;

import {
  SpotifyApi,
  Devices,
  Track,
  AccessToken,
  PartialSearchResult,
} from '@spotify/web-api-ts-sdk';

/**
 * Class that handles the playback of music using the Spotify API
 * A SpotifyPlayback object is created for each music session a host user starts
 * Authentication is performed with the Spotify API using the access token of the host user
 */
export class SpotifyPlayback {
  private _queue: Array<Track>;

  private _activeDevices: Devices;

  private _sdk: SpotifyApi;

  private _accessToken: AccessToken;

  constructor(accessToken: AccessToken) {
    this._queue = [];
    this._sdk = SpotifyApi.withAccessToken(
      process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID as string,
      accessToken,
    );
    this._activeDevices = {} as Devices;
    this._accessToken = {} as AccessToken;
  }

  /**
   * Call Spotifies Authentication method
   * Confirms the user gave a vaid access token and sets the access token for the SpotifyPlayback object
   */
  public async authenticate(): Promise<AccessToken> {
    // await this._sdk.authentication.refreshAccessToken();
    const response = await this._sdk.authenticate();
    this._accessToken = response.accessToken;
    return this._accessToken;
  }

  /**
   * Gets the access token of the user hosting the music sesson
   * @returns - the access token
   */
  get accessToken(): AccessToken {
    if (!this._accessToken.access_token) {
      throw new Error("Access Token not set");
    }
    return this._accessToken;
  }

  /**
   * Queries the Spotify API for the active devices playing for the current user's playback
   * @returns - the active devices
   */
  public async getActiveDevices(): Promise<Devices> {
    const devices = await this._sdk.player.getAvailableDevices();
    this._activeDevices = devices;
    return this._activeDevices;
  }

  /**
   * Plays the current song
   */
  public async play(): Promise<void> {
    this._activeDevices.devices.forEach(async (device) => {
      await this._sdk.player.startResumePlayback(device.id as string);
    });
  }

  /**
   * Pauses the current song
   */
  public async pause(): Promise<void> {
    this._activeDevices.devices.forEach(async (device) => {
      await this._sdk.player.pausePlayback(device.id as string);
    });
  }

  /*
  * Skips to the next song in the queue
  */
  public async skip(): Promise<void> {
    if (this._queue.length < 1) {
      return;
    }

    const nextSong = this._queue[0];
    await this._sdk.player.addItemToPlaybackQueue(`spotify:track:${nextSong.id}`);
    await this._sdk.player.skipToNext(this._activeDevices.devices[0].id as string);
    this._queue.slice(1);
  }

  /**
   * Conducts a search for songs using the Spotify API
   * @param searchQuery - the search query to search for
   * @returns - the search results
   */
  public async search(searchQuery: string): Promise<Required<Pick<PartialSearchResult, "tracks">>> {
    const results = await this._sdk.search(searchQuery, ["track"]);
    return results;
  }

  /**
   * Adds a song to the queue
   * @param trackId - ID of the song to add to the queue
   */
  public async addQueue(trackId: string): Promise<void> {
    await this._sdk.tracks.get(trackId);
  }

  /**
   * Transfers playback to a device
   * @param deviceId - ID of the device to transfer playback to
   */
  public async transferPlayback(deviceId: string): Promise<void> {
    await this._sdk.player.transferPlayback([deviceId]);
  }
}

/**
 * Handles the HTTP requests to the SpotifyPlayback API
 * @param req - the HTTP request
 * @param res - the HTTP response
 */
const handler: NextApiHandler = async (req, res) => {
  if (req.method === "GET") {
    const temp = req.query.temp;
    if (!spotifyController) {
      console.log("no spotify player created");
      res.status(400).send("no spotify player created");
      return;
    }
    switch (temp) {
      case "accessToken":
        res.status(200).json(spotifyController.accessToken);
        console.log("access token: " + spotifyController.accessToken.access_token);
        break;
      case "play":
        await spotifyController.play();
        res.status(200).send("playing");
        break;
      case "pause":
        await spotifyController.pause();
        console.log("paused")
        res.status(200).send("paused");
        break;
      case "skip":
        await spotifyController.skip();
        console.log("skipped")
        res.status(200).send("skipped");
        break;
      case "search":
        const searchQuery = req.query.searchQuery;
        if (!searchQuery) {
          console.log("no search query provided");
          res.status(400).send("no search query provided");
          return;
        }
        const searchResults = await spotifyController.search(searchQuery as string);
        console.log(JSON.stringify(searchResults));
        res.status(200).json(searchResults);
        break;
      case "addQueue":
        const trackId = req.query.trackId;
        if (!trackId) {
          console.log("no track ID provided");
          res.status(400).send("no track ID provided");
          return;
        }
        await spotifyController.addQueue(trackId as string);
        console.log("added to queue");
        res.status(200).send("added to queue");
        break;
      case "transferPlayback":
        const deviceId = req.query.deviceId;
        if (!deviceId) {
          console.log("no device ID provided");
          res.status(400).send("no device ID provided");
          return;
        }
        await spotifyController.transferPlayback(deviceId as string);
        console.log("transferred playback");
        res.status(200).send("transferred playback");
        break;
      default:
        console.log("invalid query");
        res.status(400).send("invalid query");
        break;
    }
  }
  /*
  * Creates a new SpotifyPlayback object for the user
  */
  else if (req.method === "POST") {
    const userAccessToken: AccessToken = req.body.accessToken;
    console.log("user access token: " + JSON.stringify(userAccessToken));
    if (userAccessToken) {
      spotifyController = new SpotifyPlayback(userAccessToken);
      const confirmedAccessTokenTEMPORARY = await spotifyController.authenticate();
      res.status(200).json(confirmedAccessTokenTEMPORARY);
    } else {
      res.status(400).send("no access token provided");
    }
  }
  else {
    res.status(405).send("Method Not Allowed, must be GET request");
  }
};

export default handler;