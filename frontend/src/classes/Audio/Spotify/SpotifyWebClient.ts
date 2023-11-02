export default class SpotifyWebClient {
    private readonly _clientId = process.env.SPOTIFY_CLIENT_ID;
  
    private readonly _clientSecret = process.env.SPOTIFY_SECRET;
  
    private _authOptions = new URLSearchParams();
  
    private _headers;
  
    private readonly _scope = 'user-read-private user-read-email';
  
    private readonly _url = 'https://accounts.spotify.com/api/token';
  
    private _accessToken?: string;
  
    constructor() {
      this._authOptions.append('grant_type', 'client_credentials');
      this._authOptions.append('scope', this._scope);
      this._headers = {
        'Authorization':
          'Basic ' + Buffer.from(this._clientId + ':' + this._clientSecret).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      };
    }
  
    async _authenticate() {
      await fetch(this._url, {
        method: 'POST',
        body: this._authOptions,
        headers: this._headers,
      })
        .then(response => response.json())
        .then(data => {
          this._accessToken = data.access_token;
          const refreshToken = data.refresh_token; // If requested and granted
          const expiresIn = data.expires_in;
          console.log(data);
        })
        .catch(error => {
          console.error(error);
        });
    }
  
    async _fetchArtistByID(id: string) {
      console.log('Fetching: ' + this._accessToken);
      await fetch('https://api.spotify.com/v1/artists/' + id, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + this._accessToken,
        },
      })
        .then(response => response.json())
        .then(data => {
          console.log(data);
        })
        .catch(error => {
          console.error(error);
        });
    }
  
    get accessToken(): string | undefined {
      return this._accessToken;
    }
  }