/* eslint-disable prettier/prettier */
import {
  SpotifyApi,
  Devices,
  Track,
  AccessToken,
} from '@spotify/web-api-ts-sdk';
import dotenv from 'dotenv';

dotenv.config();

export default class SpotifyPlayback {
  private _queue: Array<Track>;

  private _activeDevices: Devices;

  private _internalSdk: SpotifyApi;

  private _accessToken: string;

  constructor(accessToken: AccessToken) {
    this._queue = [];
    this._internalSdk = SpotifyApi.withAccessToken(
      process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID as string,
      accessToken,
      //   Scopes.all,
    );
    this._activeDevices = {} as Devices;
    this._accessToken = accessToken.access_token;
  }

  get accessToken(): string {
    return this._accessToken;
  }

  public async getActiveDevices(): Promise<Devices> {
    const devices = await this._internalSdk.player.getAvailableDevices();
    this._activeDevices = devices;
    return this._activeDevices;
  }
}
