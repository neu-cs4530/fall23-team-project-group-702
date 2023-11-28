/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
import { Track, AccessToken, PartialSearchResult, PlaybackState } from '@spotify/web-api-ts-sdk';
// import { uniqueId } from 'lodash';
import { SpotifyUserPlayback, QueuedTrack } from './SpotifyUserPlayback';

export function generateRandomString(length: number) {
  let text = '';
  const possibleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    text += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
  }
  return text;
}

// const out = process.stdout;
// const err = process.stderr;
// const myConsole = new console.Console(out, err);

/**
 * Class that handles the music session for all players
 */
export default class SpotifyController {
  private _userMusicPlayers: SpotifyUserPlayback[];

  private _queue: Array<QueuedTrack>;

  private _songNowPlaying: Track | null;

  private _isASongPlaying: boolean;

  constructor() {
    this._userMusicPlayers = [];
    this._queue = [];
    this._songNowPlaying = null;
    this._isASongPlaying = false;
  }

  public get queue(): Array<QueuedTrack> {
    return this._queue;
  }

  public get songNowPlaying(): Track | null {
    return this._songNowPlaying;
  }

  public get isASongPlaying(): boolean {
    return this._isASongPlaying;
  }

  public get userMusicPlayers(): SpotifyUserPlayback[] {
    return this._userMusicPlayers;
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
    console.log('in addUserMusicPlayer');
    /* Create music player and transfer playback to websdk */
    const userMusicPlayer = new SpotifyUserPlayback(userAccessToken);
    const confirmedAccessToken = await userMusicPlayer.authenticate();
    if (
      !confirmedAccessToken ||
      confirmedAccessToken.access_token !== userAccessToken.access_token
    ) {
      throw new Error('Unable to authenticate user');
    }

    // Shouldn't create a new player if this user already has a player
    const userExists = this._userMusicPlayers.some(
      player => player.accessToken.access_token === userAccessToken.access_token,
    );
    if (!userExists) {
      this._userMusicPlayers.push(userMusicPlayer);
      console.log(`pushed new music player. now length: ${this.userMusicPlayers.length}`);
    }
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
      console.log(`user: ${player.accessToken.access_token}`);
    }
    console.log('~~REGISTERED USER IN THE BACKEND~~');
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
      queueId: generateRandomString(50),
      track: newTrack,
    };
    this._queue = [...this._queue, queuedTrack];

    console.log('New queue after adding to queue: ');
    for (const track of this._queue) {
      console.log(`track: ${track.track.name}`);
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
      console.log(`track: ${track.track.name}`);
    }
    return this._queue;
  }

  /**
   * Skips to the next song in the queue for all users
   * @returns - the updated queue
   */
  public async skip(): Promise<[Track | null, QueuedTrack[]]> {
    if (this._queue.length < 1) {
      console.log('empty queue, returning null and empty data...');
      return [null, []];
    }
    const nextQueuedTrack = this._queue[0];
    this._songNowPlaying = nextQueuedTrack.track;
    this._queue = this._queue.slice(1);
    for (const userMusicPlayer of this._userMusicPlayers) {
      await userMusicPlayer.nextSong(nextQueuedTrack.track.id);
    }
    this._isASongPlaying = true;

    /* Debugging */
    console.log(`New queue after skip length: ${this._queue.length}`);
    // for (const track of this._queue) {
    //   console.log('track: ' + track.track.name);
    // }
    return [nextQueuedTrack.track, this._queue];
  }

  /**
   * Toggles the playback state for all users
   * Synchronizes the music session after toggling the playback state
   */
  public async togglePlay(): Promise<boolean> {
    for (const userMusicPlayer of this._userMusicPlayers) {
      await userMusicPlayer.togglePlay();
    }
    await this.synchronize();
    this._isASongPlaying = !this._isASongPlaying;
    console.log('toggle play trigged, new playing state:');
    console.log(this._isASongPlaying);
    return this._isASongPlaying;
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
      console.log(`user: ${userMusicPlayer.accessToken.access_token}`);
    }
  }
}
