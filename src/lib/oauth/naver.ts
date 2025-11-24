// Naver OAuth 2.0 Implementation
// https://developers.naver.com/docs/login/api/

export interface NaverTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface NaverUserInfo {
  id: string;
  email?: string;
  name?: string;
  nickname?: string;
  profile_image?: string;
  age?: string;
  gender?: string;
  birthday?: string;
  birthyear?: string;
  mobile?: string;
}

export class NaverOAuth {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor(clientId: string, clientSecret: string, redirectUri: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
  }

  // Generate OAuth authorization URL
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state: state,
    });

    return `https://nid.naver.com/oauth2.0/authorize?${params.toString()}`;
  }

  // Exchange authorization code for access token
  async getAccessToken(code: string, state: string): Promise<NaverTokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code: code,
      state: state,
    });

    const response = await fetch(`https://nid.naver.com/oauth2.0/token?${params.toString()}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get access token: ${error}`);
    }

    return response.json();
  }

  // Get user information using access token
  async getUserInfo(accessToken: string): Promise<NaverUserInfo> {
    const response = await fetch('https://openapi.naver.com/v1/nid/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get user info: ${error}`);
    }

    const data = await response.json();
    
    if (data.resultcode !== '00') {
      throw new Error(`Naver API error: ${data.message}`);
    }

    return data.response;
  }
}
