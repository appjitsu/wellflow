export interface RecordingInfo {
  county?: string;
  state?: string;
  volume?: string;
  page?: string;
  instrumentNumber?: string;
}

export interface ChainOfTitleEntryProps {
  id: string;
  organizationId: string;
  leaseId: string;
  instrumentType: string; // deed|assignment|probate|affidavit|release|mortgage|other
  instrumentDate: Date;
  grantor: string;
  grantee: string;
  legalDescriptionRef?: string;
  recordingInfo?: RecordingInfo;
  notes?: string;
  createdAt?: Date;
}

/**
 * ChainOfTitleEntry Entity - A single instrument in the chain
 */
export class ChainOfTitleEntry {
  private id: string;
  private organizationId: string;
  private leaseId: string;
  private instrumentType: string;
  private instrumentDate: Date;
  private grantor: string;
  private grantee: string;
  private legalDescriptionRef?: string;
  private recordingInfo?: RecordingInfo;
  private notes?: string;
  private createdAt: Date;

  constructor(props: ChainOfTitleEntryProps) {
    this.id = props.id;
    this.organizationId = props.organizationId;
    this.leaseId = props.leaseId;
    this.instrumentType = props.instrumentType;
    this.instrumentDate = new Date(props.instrumentDate);
    this.grantor = props.grantor;
    this.grantee = props.grantee;
    this.legalDescriptionRef = props.legalDescriptionRef;
    this.recordingInfo = props.recordingInfo;
    this.notes = props.notes;
    this.createdAt = props.createdAt ?? new Date();
  }

  getId(): string {
    return this.id;
  }
  getOrganizationId(): string {
    return this.organizationId;
  }
  getLeaseId(): string {
    return this.leaseId;
  }
  getInstrumentType(): string {
    return this.instrumentType;
  }
  getInstrumentDate(): Date {
    return new Date(this.instrumentDate);
  }
  getGrantor(): string {
    return this.grantor;
  }
  getGrantee(): string {
    return this.grantee;
  }
  getLegalDescriptionRef(): string | undefined {
    return this.legalDescriptionRef;
  }
  getRecordingInfo(): RecordingInfo | undefined {
    return this.recordingInfo ? { ...this.recordingInfo } : undefined;
  }
  getNotes(): string | undefined {
    return this.notes;
  }
}
