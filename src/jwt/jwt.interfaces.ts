export interface JwtModuleOptions {
  /* privateKey: string; */
  accessTokenPrivateKey: string;
  refreshTokenPrivateKey: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
}
