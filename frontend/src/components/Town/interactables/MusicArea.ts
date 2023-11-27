import MusicAreaController from '../../../classes/interactable/MusicAreaController';
import { Song } from '../../../types/CoveyTownSocket';
import Interactable, { KnownInteractableTypes } from '../Interactable';

export default class MusicArea extends Interactable {
  private _labelText?: Phaser.GameObjects.Text;

  private _infoTextBox?: Phaser.GameObjects.Text;

  private _defaultSong?: Song;

  private _musicArea?: MusicAreaController;

  private _isInteracting = false;

  public get defaultSong() {
    if (!this._defaultSong) {
      return 'No URL found';
    }
    return this._defaultSong;
  }

  addedToScene() {
    super.addedToScene();
    this.setTintFill();
    this.setAlpha(0.3);

    this._defaultSong = this.getData('song');
    this.scene.add.text(
      this.x - this.displayWidth / 2,
      this.y + this.displayHeight / 2,
      this.name,
      { color: '#FFFFFF', backgroundColor: '#000000' },
    );
    this._musicArea = this.townController.getMusicAreaController(this);
    this.setDepth(-1);
  }

  overlap(): void {
    this._showInfoBox();
  }

  private _showInfoBox() {
    if (!this._infoTextBox) {
      this._infoTextBox = this.scene.add
        .text(
          this.scene.scale.width / 2,
          this.scene.scale.height / 2,
          "You've found an empty music area!\nPress spacebar to login to Spotify and start jamming!",
          { color: '#000000', backgroundColor: '#FFFFFF' },
        )
        .setScrollFactor(0)
        .setDepth(30);
    }
    this._infoTextBox.setVisible(true);
    this._infoTextBox.x = this.scene.scale.width / 2 - this._infoTextBox.width / 2;
  }

  overlapExit(): void {
    this._labelText?.setVisible(false);
    this._infoTextBox?.setVisible(false);
    if (this._isInteracting) {
      console.log('interaction ended');
      this.townController.interactableEmitter.emit('endInteraction', this);
      this._isInteracting = false;
    }
  }

  interact(): void {
    console.log('inside interACT');
    this._labelText?.setVisible(false);
    this._isInteracting = true;
  }

  getType(): KnownInteractableTypes {
    return 'musicArea';
  }
}
