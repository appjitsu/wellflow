import { ICommand } from '@nestjs/cqrs';

export interface RecordingInfo {
  county?: string;
  state?: string;
  volume?: string;
  page?: string;
  docNumber?: string;
  instrumentNumber?: string;
}

export class AddChainOfTitleEntryCommand implements ICommand {
  constructor(
    public readonly organizationId: string,
    public readonly leaseId: string,
    public readonly instrumentType: string,
    public readonly instrumentDate: Date,
    public readonly grantor: string,
    public readonly grantee: string,
    public readonly legalDescriptionRef?: string,
    public readonly recordingInfo?: RecordingInfo,
    public readonly notes?: string,
  ) {}
}
