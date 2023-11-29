import { AccessToken, Track } from '@spotify/web-api-ts-sdk';
<<<<<<< HEAD
import { MusicArea as MusicAreaModel, QueuedTrack } from '../../types/CoveyTownSocket';
=======
import {
  MusicArea,
  MusicArea as MusicAreaModel,
  QueuedTrack,
  Song,
} from '../../types/CoveyTownSocket';
import PlayerController from '../PlayerController';
>>>>>>> c7c93de (backend informed private sessions, see button in firstmusic to see how to control, could be cleaner)
import TownController from '../TownController';
import InteractableAreaController, { BaseInteractableEventMap } from './InteractableAreaController';

/**
 * The events that a MusicAreaController can emit
 */
export type MusicAreaEvents = BaseInteractableEventMap & {
  /* Base Music Room Events*/
  topicChange: (topic: string) => void;
  currentSongChange: (song: Track | null) => void;
  currentQueueChange: (queue: QueuedTrack[]) => void;
  sessionInProgressChange: (sessionInProgress: boolean) => void;
  accessTokenChange: (accessToken: AccessToken) => void;
  playbackStateChange: (playbackState: boolean) => void;
  roomVisibilityChange: (privateState: boolean) => void;
  /* Private Room Music Events */
  roomPrivacyChange: (privateState: boolean) => void;
};

/**
 * A MusicAreaController manages the state for a ViewingArea in the frontend app, serving as a bridge between the video
 * that is playing in the user's browser and the backend TownService, ensuring that all players watching the same video
 * are synchronized in their playback.
 *
 * The MusicAreaController implements callbacks that handle events from the spotify player in this browser window, and
 * emits updates when the state is updated, @see MusicAreaEvents
 */
export default class MusicAreaController extends InteractableAreaController<
  MusicAreaEvents,
  MusicAreaModel
> {
  private _model: MusicAreaModel;

  protected _townController: TownController;

  /**
   * Constructs a new MusicAreaController, initialized with the state of the
   * provided musicAreaModel.
   *
   * @param musicAreaModel The music area model that this controller should represent
   */
  constructor(musicAreaModel: MusicAreaModel, townController: TownController) {
    super(musicAreaModel.id);
    this._model = musicAreaModel;
    this._townController = townController;
    console.log('MusicAreaController constructor');
  }

  get topic(): string {
    if (this._model.topic === undefined) {
      throw new Error('Topic is undefined');
    }
    return this._model.topic;
  }

  /**
   * the topic of the session
   */
  public set topic(topic: string) {
    if (this._model.topic !== topic) {
      this._model.topic = topic;
      this.emit('topicChange', topic);
    }
  }

  get sessionInProgress(): boolean {
    if (this._model.sessionInProgress === undefined) {
      throw new Error('sessionInProgress is undefined');
    }
    return this._model.sessionInProgress;
  }

  public set sessionInProgress(sessionInProgress: boolean) {
    if (this._model.sessionInProgress !== undefined) {
      this._model.sessionInProgress = sessionInProgress;
      this.emit('sessionInProgressChange', sessionInProgress);
    } else {
      throw new Error('session in progress is undefined');
    }
  }

  get currentSong(): Track {
    return this._model.currentSong;
  }

  public set currentSong(currentSong: Track) {
    this._model.currentSong = currentSong;
    this.emit('currentSongChange', currentSong);
  }

  get isPlaying(): boolean {
    return this._model.isPlaying;
  }

  public set isPlaying(playbackState: boolean) {
    this.emit('playbackStateChange', playbackState);
    this._model.isPlaying = playbackState;
  }

  get currentQueue(): QueuedTrack[] {
    return this._model.songQueue;
  }

  public set currentQueue(currentQueue: QueuedTrack[]) {
    this._model.songQueue = currentQueue;
    this.emit('currentQueueChange', currentQueue);
  }

  public isActive(): boolean {
    return this._model.sessionInProgress !== undefined;
  }


  /**
   * @returns MusicAreaModel that represents the current state of this MusicAreaController
   */
  public toInteractableAreaModel(): MusicAreaModel {
    return this._model;
  }

  /**
   * Applies updates to this music area controller's model, setting the fields
   *
   *
   * @param updatedModel
   */
  protected _updateFrom(updatedModel: MusicAreaModel): void {
    // Invokes setters, which have emit()
    console.log('frontend says that isplayingstate is now: ' + updatedModel.isPlaying);
    if (updatedModel.topic !== undefined) this.topic = updatedModel.topic;
    if (updatedModel.sessionInProgress != undefined)
      this.sessionInProgress = updatedModel.sessionInProgress;
    if (updatedModel.currentSong !== undefined) this.currentSong = updatedModel.currentSong;
    if (updatedModel.songQueue !== undefined) this.currentQueue = updatedModel.songQueue;
    if (updatedModel.isPlaying !== undefined) this.isPlaying = updatedModel.isPlaying;
  }

  /**
   * Tells backend to create a musicSession.
   * @param sessionName name
   */
  public async createSession(sessionName: string) {
    const instanceID = this.id;
    if (!instanceID) {
      throw new Error('instanceID undefined');
    }
    await this._townController.sendInteractableCommand(this.id, {
      type: 'CreateMusicSession',
      topic: sessionName,
    });
  }

  public async leaveSession(accessToken: AccessToken) {
    const instanceID = this.id;
    if (!instanceID) {
      throw new Error('instanceID undefined');
    }
    await this._townController.sendInteractableCommand(this.id, {
      type: 'RemoveUserFromMusicSession',
      accessToken: accessToken,
    });
  }

  /**
   * Creates the SpotifyPlayer for this user's access token and device id.
   * @param accessToken a Spotify access token
   * @param deviceId a Spotify device id
   */
  public async addUserToSession(accessToken: AccessToken, deviceId: string) {
    console.log('attempting to send interactableCommand(AddUsertoMusicSession)');
    const instanceID = this.id;
    if (!instanceID) {
      throw new Error('instanceID undefined');
    }
    await this._townController.sendInteractableCommand(this.id, {
      type: 'AddUserToMusicSession',
      accessToken: accessToken,
      deviceId: deviceId,
    });
  }

  public async removeUserFromSession() {
    const instanceID = this.id;
    if (!instanceID) {
      throw new Error('instanceID undefined');
    }
    console.log('send RemoveUserFromMusicSession');
    await this._townController.sendInteractableCommand(this.id, {
      type: 'RemoveUserFromMusicSession',
      accessToken: this._townController.spotifyAccessToken,
    });
  }

  /**
   * Tells backend to search songs for this user.
   * @param sessionName name
   */
  public async searchSongs(searchQuery: string): Promise<Track[]> {
    const instanceID = this.id;
    if (!instanceID) {
      throw new Error('instanceID undefined');
    }
    const results = await this._townController.sendInteractableCommand(this.id, {
      type: 'SearchSongsMusicSession',
      searchQuery,
    });
    return results.searchResults;
  }

  /**
   * Tells backend to add to queue.
   * @param trackId spotify ID for track
   */
  public async addToQueue(trackId: string) {
    const instanceID = this.id;
    if (!instanceID) {
      throw new Error('instanceID undefined');
    }
    await this._townController.sendInteractableCommand(this.id, {
      type: 'AddMusicToSessionQueue',
      trackId,
    });
    // this.currentQueue = response.updatedQueue;
  }

  /**
   * Tells backend to remove a track using its generated queueID.
   * @param queueId spotify queueId for track
   */
  public async removeFromQueue(queueId: string) {
    const instanceID = this.id;
    if (!instanceID) {
      throw new Error('instanceID undefined');
    }
    await this._townController.sendInteractableCommand(this.id, {
      type: 'RemoveMusicFromSessionQueue',
      queueId,
    });
    // this.currentQueue = response.updatedQueue;
  }

  /**
   * Tells backend to skip the head of the queue if nonempty
   */
  public async skip() {
    const instanceID = this.id;
    if (!instanceID) {
      throw new Error('instanceID undefined');
    }
    await this._townController.sendInteractableCommand(this.id, {
      type: 'SkipSongMusicSession',
    });
    // this.currentSong = response.currentSong;
    // this.currentQueue = response.updatedQueue;
  }

  /**
   * Pauses or Plays the current song based on its current playback state
   * Payload: boolean representing the new playback state
   */
  public async togglePlay() {
    const instanceID = this.id;
    if (!instanceID) {
      throw new Error('instanceID undefined');
    }
    await this._townController.sendInteractableCommand(this.id, {
      type: 'TogglePlayMusicSession',
    });
    // this.isPlaying = isPlaying;
  }
}
