import {
  SpotifyApi,
  Devices,
  Track,
  AccessToken,
  PartialSearchResult,
  PlaybackState,
  Device,
  // Device,
} from '@spotify/web-api-ts-sdk';

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
export class SpotifyUserPlayback {
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
    this._allDevices = null as unknown as Devices;
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
      return null as unknown as AccessToken;
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
   * Plays the song, resumes the playbackon the device
   */
  public async resumePlayback(): Promise<void> {
    /* fetches devices from spotify */
    await this.getDevices();
    if (this._activeDevices.devices.length < 1) {
      /* return false if there are no active devices */
      // consol.log('resumePlayback() not executed, no active devices');
      return;
    }
    /* get song state from sdk. if state doesn't exist, then no song is currently playing/paused */
    const thisUserState = await this._sdk.player.getCurrentlyPlayingTrack();
    this._activeDevices.devices.forEach(async device => {
      /* if device is not active, don't to anything. If device is not Covey Player, do not adjust playback */
      if (!device.is_active || device.name !== 'Covey Player') {
        // consol.log(`device ${device.name} is not active or has incorrect name: ${device.name}`);
      } else if (thisUserState && !thisUserState.is_playing) {
        // consol.log(`in resumePlayback(): # devices active: ${this._activeDevices.devices.length}`);
        /* 
          We know a song is currently.
          If state doesn't exist, then no song is currently playing/paused so do nothing to avoid spotify error
          If state exists, then only resume playback if the song is paused
        */
        await this._sdk.player.startResumePlayback(device.id as string);
      }
    });
  }

  /**
   * Plays the song, resumes the playbackon the device
   */
  public async pausePlayback(): Promise<void> {
    /* fetches devices from spotify */
    await this.getDevices();
    if (this._activeDevices.devices.length < 1) {
      /* return false if there are no active devices */
      // consol.log('resumePlayback() not executed, no active devices');
      return;
    }
    /* get song state from sdk. if state doesn't exist, then no song is currently playing/paused */
    const state = await this._sdk.player.getCurrentlyPlayingTrack();
    this._activeDevices.devices.forEach(async device => {
      /* if device is not active, don't to anything. If device is not Covey Player, do not adjust playback */
      if (!device.is_active || device.name !== 'Covey Player') {
        // device is not active or has incorrect name
      } else if (state && state.is_playing) {
        /* 
          We know a song is currently.
          If state doesn't exist, then no song is currently playing/paused so do nothing to avoid spotify error
          If state exists, then only resume playback if the song is paused
        */
        /* if state doesn't exist, this throws an error */
        await this._sdk.player.pausePlayback(device.id as string);
      }
    });
  }

  /*
   * Skips to the next song provided.
   * Adds to Spotifies queue for the user (on the cloud) then skips to that song
   * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!! This is effectively the same as playSongNow, but is potentially has less delay
   * @param trackId - ID of the song to skip to
   */
  public async nextSong(trackId: string): Promise<void> {
    await this.getDevices();
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
    const response = await fetch(`https://api.spotify.com/v1/search?q=${searchQuery}&type=track`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this._accessToken.access_token}`,
      },
    });
    const results = (await response.json()) as Required<Pick<PartialSearchResult, 'tracks'>>;
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
    await this.getDevices();
    async function checkDeviceTransfer(
      id: string,
      devices: Device[],
      playback: SpotifyUserPlayback,
    ) {
      const updatedDevices = await playback.getDevices();
      for (const device of devices) {
        if (device.id === id) {
          return;
        }
      }
      await checkDeviceTransfer(id, updatedDevices.devices, playback);
    }
    checkDeviceTransfer(deviceId, this._activeDevices.devices, this);
  }

  /**
   * Plays a song
   * @param trackId - ID of the song to play
   * @throws - if the device has not been transferred to the web sdk yet
   * @throws - if unable to play song on the device
   */
  public async playSongNow(trackId: string, seek?: number): Promise<void> {
    if (!this._deviceId || this._deviceId === '') {
      throw new Error('Device has not been transferred to the web sdk yet.');
    }
    const playerDevice = await this.getDevices();
    let requestBody = JSON.stringify({ uris: [`spotify:track:${trackId}`] });
    if (seek) {
      requestBody = JSON.stringify({ uris: [`spotify:track:${trackId}`], position_ms: seek });
    }
    playerDevice.devices.forEach(async device => {
      if (device.id === this._deviceId && device.name === 'Covey Player') {
        const playSongResponse = await fetch(
          `https://api.spotify.com/v1/me/player/play?device_id=${device.id}`,
          {
            method: 'PUT',
            body: requestBody,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this._accessToken.access_token}`,
            },
          },
        );
        const text = await playSongResponse.text();
        if (!playSongResponse.ok) {
          throw new Error(`Unable to play song on device - Error: ${text}`);
        }
      }
    });
  }

  /**
   * Skips to a position in the song
   * @param positionMs - the position in milliseconds to seek to
   */
  public async seekToPosition(positionMs: number): Promise<void> {
    // consol.log(`seeking to position: ${positionMs}`);
    await this.getDevices();
    // consol.log(
    // `num active devices at time of seek: ${JSON.stringify(this._activeDevices.devices.length)}`,
    // );
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
