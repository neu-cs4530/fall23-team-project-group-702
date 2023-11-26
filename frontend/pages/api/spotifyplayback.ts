import { NextApiHandler } from 'next';
import {
  SpotifyApi,
  Devices,
  Track,
  AccessToken,
  PartialSearchResult,
  PlaybackState,
} from '@spotify/web-api-ts-sdk';
import { uniqueId } from 'lodash';

// Uniquely-identifiable Track added to a Spotify Playback Queue
export interface QueuedTrack {
  queueId: string;
  track: Track;
}

/**
 * Class that handles the playback of music using the Spotify API
 * A SpotifyPlayback object is created for each music session a host user starts
 * Authentication is performed with the Spotify API using the access token of the host user
 */
export class UserMusicPlayer {
  private _activeDevices: Devices;

  private _allDevices: Devices;

  public _sdk: SpotifyApi;

  private _accessToken: AccessToken;

  /* The ID of the device that the user is currently playing music on (helps avoid conflicts with other user devices) */
  private _deviceId: string;

  constructor(accessToken: AccessToken) {
    this._sdk = SpotifyApi.withAccessToken(
      process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID as string,
      accessToken,
    );
    this._activeDevices = {} as Devices;
    // eslint-disable-next-line prettier/prettier
    this._allDevices = (null as unknown) as Devices;
    this._accessToken = {} as AccessToken;
    this._deviceId = '';
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
      // eslint-disable-next-line prettier/prettier
      return (null as unknown) as AccessToken;
    }
    return this._accessToken;
  }

  /**
   * Queries the Spotify API for the available devices
   * Sets the available devices and active devices
   * @returns - all available devices
   */
  public async getDevices(): Promise<Devices> {
    /* Get all devices */
    const devices = await this._sdk.player.getAvailableDevices();

    /* Set all devices */
    const devicesDeepCopy = JSON.parse(JSON.stringify(devices));
    this._allDevices = devicesDeepCopy;

    /* filter and set active devices */
    devices.devices = devices.devices.filter(device => device.is_active);
    this._activeDevices = devices;
    return this._allDevices;
  }

  /**
   * Plays/Pauses the current song.
   * @returns - after the toggle, true if the song is playing, false if the song is paused
   */
  public async togglePlay(): Promise<boolean> {
    await this.getDevices();
    const state = await this._sdk.player.getCurrentlyPlayingTrack();
    this._activeDevices.devices.forEach(async device => {
      if (!device.is_active) {
        return;
      }

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
    /* return false if there are no active devices */
    console.log('no active devices');
    return false;
  }

  /*
   * Skips to the next song provided.
   * Adds to Spotifies queue for the user (on the cloud) then skips to that song
   * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!! This is effectively the same as playSongNow, but is potentially has less delay
   * @param trackId - ID of the song to skip to
   */
  public async nextSong(trackId: string): Promise<void> {
    await this.getDevices();
    console.log(
      `active devices length at time of skip: ` +
        JSON.stringify(this._activeDevices.devices.length),
    );
    if (this._activeDevices.devices.length < 1) {
      return;
    }
    await this._sdk.player.addItemToPlaybackQueue(`spotify:track:${trackId}`);
    await this._sdk.player.skipToNext(this._activeDevices.devices[0].id as string);
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
   * Get track
   * @param trackId - ID of the song to get
   * @returns - the track
   */
  public async getTrack(trackId: string): Promise<Track> {
    const track = await this._sdk.tracks.get(trackId);
    return track;
  }

  /**
   * Transfers playback to a device
   * @param deviceId - ID of the device to transfer playback to
   */
  public async transferPlayback(deviceId: string): Promise<void> {
    await this._sdk.player.transferPlayback([deviceId], false);
    this._deviceId = deviceId;
    /* wait until device transfer is complete
       very good forumn: https://community.spotify.com/t5/Spotify-for-Developers/Cannot-Transfer-Playback-Descriptor-ID/td-p/5351203
       description: 
       the device transfer is not complete until the device is in the active devices list
       spotify will return status code 202 to indicate the command was a success but the transfer is pending
       this also applies to when using the playNow method (when using play song web api route)
     */
    let deviceTransferComplete = false;
    while (!deviceTransferComplete) {
      await this.getDevices();
      for (const device of this._activeDevices.devices) {
        if (device.id === deviceId) {
          deviceTransferComplete = true;
        }
      }
      if (!deviceTransferComplete) {
        console.log('LOOPING');
        console.log(new Date());
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(new Date());
      }
    }
    console.log(
      `transfer complete. active devices length: ` +
        JSON.stringify(this._activeDevices.devices.length),
    );
  }

  /**
   * Plays a song
   * @param trackId - ID of the song to play
   * @throws - if the device has not been transferred to the web sdk yet
   * @throws - if unable to play song on the device
   */
  public async playSongNow(trackId: string): Promise<void> {
    if (!this._deviceId || this._deviceId === '') {
      throw new Error('Device has not been transferred to the web sdk yet.');
    }
    const playerDevice = await this.getDevices();
    for (const device of playerDevice.devices) {
      if (device.id === this._deviceId) {
        const playSongResponse = await fetch(
          'https://api.spotify.com/v1/me/player/play?device_id=' + device.id,
          {
            method: 'PUT',
            body: JSON.stringify({ uris: [`spotify:track:${trackId}`] }),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this._accessToken.access_token}`,
            },
          },
        );
        const text = await playSongResponse.text();
        console.log(
          `name: ${device.name} || playSongResponse: ${playSongResponse.status} || text: ${text}`,
        );
        if (!playSongResponse.ok) {
          throw new Error(`Unable to play song on device - Error: ${text}`);
        }
      }
    }
  }

  /**
   * Skips to a position in the song
   * @param positionMs - the position in milliseconds to seek to
   */
  public async seekToPosition(positionMs: number): Promise<void> {
    console.log('seeking to position: ' + positionMs);
    await this.getDevices();
    console.log(
      `num active devices at time of seek: ` + JSON.stringify(this._activeDevices.devices.length),
    );
    await this._sdk.player.seekToPosition(positionMs);
  }

  /**
   * Gets the current playback state
   * @returns - null if no song is playing, otherwise the current playback state
   */
  public async getCurrentlyPlayingTrack(): Promise<PlaybackState | null> {
    const response = await this._sdk.player.getCurrentlyPlayingTrack();
    if (!response) {
      return null;
    }
    return response;
  }
}

/**
 * Class that handles the music session for all players
 */
export class MusicSessionController {
  private _userMusicPlayers: UserMusicPlayer[];

  private _queue: Array<QueuedTrack>;

  constructor() {
    this._userMusicPlayers = [];
    this._queue = [];
  }

  /**
   * Adds a user to the music session.
   * Creates a new SpotifyPlayback object for the user
   * If there is a song playing, plays a song and synchronizes the music session
   * @param deviceId - the ID of the device to transfer playback
   * @param userAccessToken - the access token of the user hosting the music session
   * @returns - the access token of the user
   */
  public async addUserMusicPlayer(deviceId: string, userAccessToken: AccessToken): Promise<void> {
    /* Create music player and transfer playback to websdk */
    const userMusicPlayer = new UserMusicPlayer(userAccessToken);
    const confirmedAccessToken = await userMusicPlayer.authenticate();
    if (
      !confirmedAccessToken ||
      confirmedAccessToken.access_token !== userAccessToken.access_token
    ) {
      throw new Error('Unable to authenticate user');
    }
    this._userMusicPlayers.push(userMusicPlayer);
    await this.transferPlayback(deviceId, confirmedAccessToken.access_token);
    const hostUserState = await this.getCurrentHostPlaybackState();
    /* If song is currently playing, added check for players > 1 because we don't need to auto-play if only host */
    if (hostUserState && this._userMusicPlayers.length > 1) {
      console.log(
        `in add music player - host user state: currently playing item = ${JSON.stringify(
          hostUserState.item.id,
        )} || progress_ms = ${JSON.stringify(
          hostUserState.progress_ms,
        )} || track name = ${JSON.stringify(hostUserState.item.name)}`,
      );
      await userMusicPlayer.nextSong(hostUserState.item.id);
      await this.synchronize();
    }
    console.log('Current users in music session: ');
    for (const player of this._userMusicPlayers) {
      console.log('user: ' + player.accessToken.access_token);
    }
  }

  /**
   * Synchronizes the music session if a song is playing
   * @throws - if there are no users in the music session
   */
  public async synchronize(): Promise<void> {
    const hostUserState = await this.getCurrentHostPlaybackState();
    /* hostUserState is null if no song is currently playing */
    if (!hostUserState) {
      return;
    }
    /* Song is currnetly playing, perform synchronization */
    const hostUserPosition = hostUserState.progress_ms;
    for (const userMusicPlayer of this._userMusicPlayers) {
      const track = await userMusicPlayer.getCurrentlyPlayingTrack();
      /* Checks that the user is playing the same song as the host */
      if (track?.item.id !== hostUserState.item.id) {
        await userMusicPlayer.nextSong(hostUserState.item.id);
      }
      await userMusicPlayer.seekToPosition(hostUserPosition);
    }
  }

  /**
   * Gets the current playback state of the host user
   * @returns - the current playback state of the host user
   */
  public async getCurrentHostPlaybackState(): Promise<PlaybackState | null> {
    if (this._userMusicPlayers.length < 1) {
      throw new Error('No users in music session');
    }
    const hostUserMusicPlayer = this._userMusicPlayers[0];
    const hostUserState = await hostUserMusicPlayer.getCurrentlyPlayingTrack();
    return hostUserState;
  }

  /**
   * Adds a song to queue
   * @param trackId - ID of the song to add to the queue
   * @returns - the updated queue
   */
  public async addSongToQueue(trackId: string): Promise<QueuedTrack[]> {
    if (this._userMusicPlayers.length < 1) {
      throw new Error('No users in music session');
    }
    const newTrack = await this._userMusicPlayers[0].getTrack(trackId);
    const queuedTrack: QueuedTrack = {
      queueId: uniqueId(),
      track: newTrack,
    };
    this._queue = [...this._queue, queuedTrack];

    console.log('New queue after adding to queue: ');
    for (const track of this._queue) {
      console.log('track: ' + track.track.name);
    }
    return this._queue;
  }

  /**
   * Removes a song from the queue
   * @param queueId - queue ID of the song to remove from the queue (we generate queueID)
   * @returns - the updated queue
   */
  public async removeFromQueue(queueId: string): Promise<QueuedTrack[]> {
    if (this._userMusicPlayers.length < 1) {
      throw new Error('No users in music session');
    }
    this._queue = this._queue.filter(track => track.queueId !== queueId);
    /* Debugging */
    console.log('New queue after remove: ');
    for (const track of this._queue) {
      console.log('track: ' + track.track.name);
    }
    return this._queue;
  }

  /**
   * Skips to the next song in the queue for all users
   * @returns - the updated queue
   */
  public async skip(): Promise<QueuedTrack[]> {
    if (this._queue.length < 1) {
      return [];
    }
    const nextSong = this._queue[0];
    this._queue = this._queue.slice(1);
    for (const userMusicPlayer of this._userMusicPlayers) {
      await userMusicPlayer.nextSong(nextSong.track.id);
    }

    /* Debugging */
    console.log('New queue after skip: ');
    for (const track of this._queue) {
      console.log('track: ' + track.track.name);
    }

    return this._queue;
  }

  /**
   * Toggles the playback state for all users
   * Synchronizes the music session after toggling the playback state
   */
  public async togglePlay(): Promise<void> {
    for (const userMusicPlayer of this._userMusicPlayers) {
      await userMusicPlayer.togglePlay();
    }
    await this.synchronize();
  }

  /**
   * Plays a song for all users
   * @param trackId - ID of the song to play
   */
  public async playSongNow(trackId: string): Promise<void> {
    for (const userMusicPlayer of this._userMusicPlayers) {
      await userMusicPlayer.playSongNow(trackId);
    }
  }

  /**
   * Conducts a search for songs using the Spotify API
   * @param searchQuery - the search query to search for
   * @returns the search results
   */
  public async search(searchQuery: string): Promise<Required<Pick<PartialSearchResult, 'tracks'>>> {
    if (!searchQuery) {
      throw new Error('No search query provided');
    }
    if (this._userMusicPlayers.length < 1) {
      throw new Error('No users in music session');
    }
    const response = await this._userMusicPlayers[0].search(searchQuery);
    return response;
  }

  /**
   * Transfers playback of device to web sdk
   * @param deviceId the ID of the device to transfer playback
   * @param accessToken the access token of the user hosting the music session
   */
  public async transferPlayback(deviceId: string, accessToken: string): Promise<void> {
    if (!deviceId || !accessToken || accessToken === '' || deviceId === '') {
      throw new Error('No deviceID/accessToken provided');
    }
    if (this._userMusicPlayers.length < 1) {
      throw new Error('No users in music session');
    }
    await this._userMusicPlayers
      .find(userMusicPlayer => userMusicPlayer.accessToken.access_token === accessToken)
      ?.transferPlayback(deviceId);
  }

  /**
   * Remove a user from the music session
   * @param accessToken - the access token of the user to remove
   */
  public async removeUser(accessToken: string): Promise<void> {
    if (!accessToken || accessToken === '') {
      throw new Error('No accessToken provided');
    }
    this._userMusicPlayers = this._userMusicPlayers.filter(
      userMusicPlayer => userMusicPlayer.accessToken.access_token !== accessToken,
    );
    console.log('Current users in music session: ');
    for (const userMusicPlayer of this._userMusicPlayers) {
      console.log('user: ' + userMusicPlayer.accessToken.access_token);
    }
  }
}

const musicSessionController: MusicSessionController = new MusicSessionController();

/**
 * Handles the HTTP requests to the SpotifyPlayback API
 * @param req - the HTTP request
 * @param res - the HTTP response
 */
const handler: NextApiHandler = async (req, res) => {
  if (req.method === 'GET') {
    const temp = req.query.temp;
    console.log('[GET] A request was made to spotifyplayback...');
    /*
     * If a MusicSessionController has not been created, then a session has not been started
     * In this scenario, do not allow any commands to be made
     */
    if (!musicSessionController) {
      console.log('no spotify player created');

      res.status(400).send('no spotify player created');
      return;
    }
    switch (temp) {
      case 'skip': {
        const updatedQueue = await musicSessionController.skip();
        console.log('skipped');
        res.status(200).json(updatedQueue);
        break;
      }
      case 'togglePlay': {
        await musicSessionController.togglePlay();
        res.status(200).send('Altered playback state');
        break;
      }
      case 'search': {
        const searchQuery = req.query.searchQuery;
        if (!searchQuery) {
          console.log('no search query provided');
          res.status(400).send('no search query provided');
          return;
        }
        const searchResults = await musicSessionController.search(searchQuery as string);
        console.log('Search successful');
        res.status(200).json(searchResults);
        break;
      }
      case 'playSong': {
        const trackId = req.query.trackId;
        if (!trackId) {
          console.log('no track ID provided');
          res.status(400).send('no track ID provided');
          return;
        }
        await musicSessionController.playSongNow(trackId as string);
        res.status(200).send('playing song');
        break;
      }
      case 'addQueue': {
        const trackId = req.query.trackId;
        if (!trackId) {
          console.log('no track ID provided');
          res.status(400).send('no track ID provided');
          return;
        }
        const updatedQueue = await musicSessionController.addSongToQueue(trackId as string);
        console.log('added to queue');
        res.status(200).json(updatedQueue);
        break;
      }
      case 'removeFromQueue': {
        const queueId = req.query.queueId;
        if (!queueId) {
          console.log('no track ID provided');
          res.status(400).send('no track ID provided');
          return;
        }
        const updatedQueue = musicSessionController.removeFromQueue(queueId as string);
        console.log('removed from queue');
        res.status(200).json(updatedQueue);
        break;
      }
      default:
        console.log('invalid query');
        res.status(400).send('invalid query');
        break;
    }
  } else if (req.method === 'POST') {
    /* Creates a new SpotifyPlayback object for the user */
    const userAccessToken: AccessToken = req.body.accessToken;
    const deviceId: string = req.body.deviceId;

    if (userAccessToken && deviceId) {
      console.log('received access token. creating spotify playback object');
      const confirmedAccessToken = await musicSessionController.addUserMusicPlayer(
        deviceId,
        userAccessToken,
      );
      res.status(200).json(confirmedAccessToken);
    } else {
      console.log('400, should not reach');
      res.status(400).send('no access token/device ID provided');
    }
  } else if (req.method === 'DELETE') {
    const accessToken = req.query.accessToken;
    if (!accessToken) {
      console.log('no access token provided');
      res.status(400).send('no access token provided');
      return;
    }
    await musicSessionController.removeUser(accessToken as string);
    console.log('removed user');
    res.status(200).send('removed user');
  } else {
    console.log('405 should not reach');
    res.status(405).send('Method Not Allowed, must be GET request');
  }
};

export default handler;
