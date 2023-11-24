import { NextApiHandler } from 'next';

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

  private _allDevices: Devices;

  private _sdk: SpotifyApi;

  private _accessToken: AccessToken;

  constructor(accessToken: AccessToken) {
    this._queue = [];
    this._sdk = SpotifyApi.withAccessToken(
      process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID as string,
      accessToken,
    );
    this._activeDevices = {} as Devices;
    this._allDevices = null as unknown as Devices;
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
    if (this._accessToken === ({} as AccessToken)) {
      return null as unknown as AccessToken;
    }
    return this._accessToken;
  }

  /**
   * Queries the Spotify API for the active devices playing for the current user's playback
   * @returns - the active devices
   */
  public async getDevices(): Promise<Devices> {
    const devices = await this._sdk.player.getAvailableDevices();
    console.log('all devices: ' + JSON.stringify(devices.devices));
    this._allDevices = devices;
    devices.devices = devices.devices.filter(device => device.is_active);
    this._activeDevices = devices;
    // console.log('active devices: ' + JSON.stringify(this._activeDevices.devices));
    // console.log('all devices: ' + JSON.stringify(this._allDevices.devices));
    return this._activeDevices;
  }

  public async togglePlay(): Promise<boolean> {
    await this.getDevices();
    const state = await this._sdk.player.getCurrentlyPlayingTrack();
    this._activeDevices.devices.forEach(async device => {
      if (!device.is_active) {
        return;
      }

      // const state = await this._sdk.player.getPlaybackState(undefined);
      if (state && state.is_playing) {
        console.log('pausing playback');
        await this._sdk.player.pausePlayback(device.id as string);
        return false;
      } else {
        console.log('starting playback');
        await this._sdk.player.startResumePlayback(device.id as string);
        return true;
      }
    });
    // return false if there are no active devices
    console.log('no active devices');
    return false;
  }

  /*
   * Skips to the next song in the queue
   * @returns - the song that was skipped to
   */
  public async skip(): Promise<Track | null> {
    await this.getDevices();
    console.log(`active devices at time of skip: ` + JSON.stringify(this._activeDevices.devices));
    console.log(`all devices at time of skip: ` + JSON.stringify(this._allDevices.devices));
    if (this._queue.length < 1) {
      return null;
    } else if (this._activeDevices.devices.length < 1) {
      return null;
    }

    const nextSong = this._queue[0];
    await this._sdk.player.addItemToPlaybackQueue(`spotify:track:${nextSong.id}`);
    await this._sdk.player.skipToNext(this._activeDevices.devices[0].id as string);
    const currentlyPlaying = this._queue.slice(1)[0];
    console.log('new queue after skip: ' + JSON.stringify(this._queue));
    return currentlyPlaying;
  }

  /**
   * Conducts a search for songs using the Spotify API
   * @param searchQuery - the search query to search for
   * @returns - the search results
   */
  public async search(searchQuery: string): Promise<Required<Pick<PartialSearchResult, 'tracks'>>> {
    const results = await this._sdk.search(searchQuery, ['track']);
    return results;
  }

  /**
   * Adds a song to the queue
   * @param trackId - ID of the song to add to the queue
   */
  public async addQueue(trackId: string): Promise<Track> {
    try {
      const track = await this._sdk.tracks.get(trackId);
      this._queue = [...this._queue, track];
      console.log('queue updated: ' + JSON.stringify(this._queue));
      return track;
    } catch (e) {
      throw new Error('Error adding track to queue');
    }
  }

  /**
   * Transfers playback to a device
   * @param deviceId - ID of the device to transfer playback to
   */
  public async transferPlayback(deviceId: string): Promise<void> {
    /*
    await this.getDevices();
    if (!this._allDevices) {
      throw new Error('no set');
    }
    const deviceStrings = this._allDevices.devices.map(device => {
      if (!device.id) {
        throw new Error('no set');
      }
      return device.id;
    });
    deviceStrings.push(deviceId);
    console.log('devices to transfer to: ' + JSON.stringify(deviceStrings));
    */
    await this._sdk.player.transferPlayback([deviceId], true);
  }
}

/**
 * Handles the HTTP requests to the SpotifyPlayback API
 * @param req - the HTTP request
 * @param res - the HTTP response
 */
const handler: NextApiHandler = async (req, res) => {
  if (req.method === 'GET') {
    const temp = req.query.temp;
    /*
     * If a SpotifyController has not been created, then a session has not been started
     * In this scenario, do not allow any commands to be made
     */
    if (!spotifyController) {
      console.log('no spotify player created');

      res.status(400).send('no spotify player created');
      return;
    }
    switch (temp) {
      case 'accessToken': {
        console.log('access token sent');
        // console.log("access token: " + spotifyController.accessToken.access_token);
        if (!spotifyController.accessToken.access_token) {
          console.log('no access token');
          res.status(400).send('no access token');
          return;
        }
        res.status(200).json(spotifyController.accessToken);
        break;
      }
      case 'skip': {
        const currentlyPlayingSong = await spotifyController.skip();
        if (!currentlyPlayingSong) {
          console.log('no song to skip to');
          res.status(400).send('no song to skip to');
          return;
        }
        console.log('skipped');
        res.status(200).json(currentlyPlayingSong);
        break;
      }
      case 'togglePlay': {
        const currentlyPlaying = await spotifyController.togglePlay();
        res.status(200).json(currentlyPlaying);
        break;
      }
      case 'search': {
        const searchQuery = req.query.searchQuery;
        if (!searchQuery) {
          console.log('no search query provided');
          res.status(400).send('no search query provided');
          return;
        }
        const searchResults = await spotifyController.search(searchQuery as string);
        console.log('Search successful');
        res.status(200).json(searchResults);
        break;
      }
      case 'addQueue': {
        const trackId = req.query.trackId;
        if (!trackId) {
          console.log('no track ID provided');
          res.status(400).send('no track ID provided');
          return;
        }
        const trackAdded = await spotifyController.addQueue(trackId as string);
        console.log('added to queue');
        res.status(200).json(trackAdded);
        break;
      }
      case 'transferPlayback': {
        const deviceId = req.query.deviceId;
        if (!deviceId) {
          console.log('no device ID provided');
          res.status(400).send('no device ID provided');
          return;
        }
        await spotifyController.transferPlayback(deviceId as string);
        console.log('transferred playback');
        res.status(200).send('transferred playback');
        break;
      }
      default:
        console.log('invalid query');
        res.status(400).send('invalid query');
        break;
    }
  } else if (req.method === 'POST') {
    /*
     * Creates a new SpotifyPlayback object for the user
     */
    const userAccessToken: AccessToken = req.body.accessToken;

    // console.log("user access token: " + JSON.stringify(userAccessToken));

    if (userAccessToken) {
      console.log('received access token. creating spotify playback object');
      spotifyController = new SpotifyPlayback(userAccessToken);
      const confirmedAccessTokenTEMPORARY = await spotifyController.authenticate();
      res.status(200).json(confirmedAccessTokenTEMPORARY);
    } else {
      res.status(400).send('no access token provided');
    }
  } else {
    res.status(405).send('Method Not Allowed, must be GET request');
  }
};

export default handler;
