import { MusicArea as MusicAreaModel, Song, SongQueue } from '../../types/CoveyTownSocket';
import InteractableAreaController, { BaseInteractableEventMap } from './InteractableAreaController';


/**
 * The events that a ViewingAreaController can emit
 */
export type MusicAreaEvents = BaseInteractableEventMap & {
  /**
   * A playbackChange event indicates that the playing/paused state has changed.
   * Listeners are passed the new state in the parameter `isPlaying`
   */
  playbackChange: (isPlaying: boolean) => void;
  /**
   * A videoChange event indicates that the video selected for this viewing area has changed.
   * Listeners are passed the new video, which is either a string (the URL to a video), or
   * the value `undefined` to indicate that there is no video set.
   */
  songChange: (song: Song | undefined) => void;
};

/**
 * A ViewingAreaController manages the state for a ViewingArea in the frontend app, serving as a bridge between the video
 * that is playing in the user's browser and the backend TownService, ensuring that all players watching the same video
 * are synchronized in their playback.
 *
 * The ViewingAreaController implements callbacks that handle events from the video player in this browser window, and
 * emits updates when the state is updated, @see ViewingAreaEvents
 */
export default class MusicAreaController extends InteractableAreaController<
  MusicAreaEvents,
  MusicAreaModel
> {
  private _model: MusicAreaModel;
  private _musicArea?: MusicAreaController;

  /**
   * Constructs a new MusicAreaController, initialized with the state of the
   * provided musicAreaModel.
   *
   * @param musicAreaModel The music area model that this controller should represent
   */
  constructor(musicAreaModel: MusicAreaModel) {
    super(musicAreaModel.id);
    this._model = musicAreaModel;
  }

  public isActive(): boolean {
    return this._model.song !== undefined;
  }

  /**
   * The song currently assigned to this music area, or undefined if there is not one.
   */
  public get song() {
    return this._model.song;
  }

  /**
   * The URL of the video assigned to this viewing area, or undefined if there is not one.
   *
   * Changing this value will emit a 'videoChange' event to listeners
   */
  public set song(song: Song | undefined) {
    if (this._model.song !== song) {
      this._model.song = song;
      this.emit('songChange', song);
    }
  }

    /** TO FIX.
   * The URL of the video assigned to this viewing area, or undefined if there is not one.
 
     public get queue() {
        return this._model.queue;
      }
  
     */

      /**
       * The URL of the video assigned to this viewing area, or undefined if there is not one.
       *
       * Changing this value will emit a 'videoChange' event to listeners
       */
      public set queue(song: Song | undefined) {
        if (this._model.song !== song) {
          this._model.song = song;
          this.emit('songChange', song);
        }
      }

  /**
   * The playback state - true indicating that the video is playing, false indicating
   * that the video is paused.
   */
  public get isPlaying() {
    return this._model.isPlaying;
  }

  /**
   * The playback state - true indicating that the video is playing, false indicating
   * that the video is paused.
   *
   * Changing this value will emit a 'playbackChange' event to listeners
   */
  public set isPlaying(isPlaying: boolean) {
    if (this._model.isPlaying != isPlaying) {
      this._model.isPlaying = isPlaying;
      this.emit('playbackChange', isPlaying);
    }
  }

  /**
   * @returns ViewingAreaModel that represents the current state of this ViewingAreaController
   */
  public toInteractableAreaModel(): MusicAreaModel {
    return this._model;
  }

  /**
   * Applies updates to this viewing area controller's model, setting the fields
   * isPlaying, elapsedTimeSec and video from the updatedModel
   *
   * @param updatedModel
   */
  protected _updateFrom(updatedModel: MusicAreaModel): void {
    this.isPlaying = updatedModel.isPlaying;
    this.song = updatedModel.song;
  }
}
