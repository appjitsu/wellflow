import { Test, TestingModule } from '@nestjs/testing';
import { VersionGuard } from '../version.guard';
import { VersionService } from '../version.service';
import { Reflector } from '@nestjs/core';

describe('VersionGuard', () => {
  let service: VersionGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VersionGuard,
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: VersionService,
          useValue: {
            isVersionSupported: jest.fn(),
            getCurrentVersion: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<VersionGuard>(VersionGuard);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
