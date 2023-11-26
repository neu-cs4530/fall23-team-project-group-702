/* eslint-disable no-console */
/* eslint-disable no-promise-executor-return */
/* eslint-disable no-await-in-loop */
import {
  SpotifyApi,
  Devices,
  Track,
  AccessToken,
  PartialSearchResult,
  PlaybackState,
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
   * Plays/Pauses the current song.
   * @returns - after the toggle, true if the song is playing, false if the song is paused
   */
  public async togglePlay(): Promise<boolean> {
    await this.getDevices();
    const state = await this._sdk.player.getCurrentlyPlayingTrack();
    if (this._activeDevices.devices.length < 1) {
      /* return false if there are no active devices */
      console.log('no active devices');
      return false;
    }
    let isPlaying = false;
    this._activeDevices.devices.forEach(async device => {
      if (!device.is_active) {
        return;
      }

      if (state && state.is_playing) {
        console.log('pausing playback');
        await this._sdk.player.pausePlayback(device.id as string);
      } else {
        console.log('starting playback');
        await this._sdk.player.startResumePlayback(device.id as string);
        isPlaying = true;
      }
    });
    return isPlaying;
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
      `active devices length at time of skip: ${JSON.stringify(
        this._activeDevices.devices.length,
      )}`,
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
    const response = await fetch(`https://api.spotify.com/v1/search?q=${searchQuery}&type=track`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this._accessToken.access_token}`,
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: any = await response.json();

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
      `transfer complete. active devices length: ${JSON.stringify(
        this._activeDevices.devices.length,
      )}`,
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
          `https://api.spotify.com/v1/me/player/play?device_id=${device.id}`,
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
    console.log(`seeking to position: ${positionMs}`);
    await this.getDevices();
    console.log(
      `num active devices at time of seek: ${JSON.stringify(this._activeDevices.devices.length)}`,
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
