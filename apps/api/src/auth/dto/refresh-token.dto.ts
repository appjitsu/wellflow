// eslint-disable no-secrets/no-secrets
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Refresh Token Request DTO
 * Validates refresh token request data
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: 'Valid refresh token',
    // eslint-disable-next-line no-secrets/no-secrets
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString({ message: 'Refresh token must be a string' })
  @IsNotEmpty({ message: 'Refresh token is required' })
  refreshToken!: string;
}

/**
 * Refresh Token Response DTO
 * Response structure for successful token refresh
 */
export class RefreshTokenResponseDto {
  @ApiProperty({
    description: 'New access token',
    // eslint-disable-next-line no-secrets/no-secrets
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken!: string;

  @ApiProperty({
    description: 'New refresh token (rotated for security)',
    // eslint-disable-next-line no-secrets/no-secrets
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken!: string;
}
