import { CreateDailyDrillingReportCommand } from './create-daily-drilling-report.command';
import { CreateDailyDrillingReportDto } from '../dtos/create-daily-drilling-report.dto';

describe('CreateDailyDrillingReportCommand', () => {
  const validDto: CreateDailyDrillingReportDto = {
    id: 'report-123',
    organizationId: 'org-456',
    wellId: 'well-789',
    reportDate: '2024-03-15',
    depthMd: 5000,
    depthTvd: 4800,
    rotatingHours: 12.5,
    nptHours: 2.0,
    dayCost: 25000,
    nextOperations: 'Continue drilling to 5500 ft',
    notes: 'Normal operations, no issues',
  };

  const minimalDto: CreateDailyDrillingReportDto = {
    id: 'report-124',
    organizationId: 'org-457',
    wellId: 'well-790',
    reportDate: '2024-03-16',
  };

  describe('constructor', () => {
    it('should create a command with a complete DTO', () => {
      const command = new CreateDailyDrillingReportCommand(validDto);

      expect(command.dto).toBe(validDto);
      expect(command.dto.id).toBe('report-123');
      expect(command.dto.organizationId).toBe('org-456');
      expect(command.dto.wellId).toBe('well-789');
      expect(command.dto.reportDate).toBe('2024-03-15');
      expect(command.dto.depthMd).toBe(5000);
      expect(command.dto.depthTvd).toBe(4800);
      expect(command.dto.rotatingHours).toBe(12.5);
      expect(command.dto.nptHours).toBe(2.0);
      expect(command.dto.dayCost).toBe(25000);
      expect(command.dto.nextOperations).toBe('Continue drilling to 5500 ft');
      expect(command.dto.notes).toBe('Normal operations, no issues');
    });

    it('should create a command with a minimal DTO', () => {
      const command = new CreateDailyDrillingReportCommand(minimalDto);

      expect(command.dto).toBe(minimalDto);
      expect(command.dto.id).toBe('report-124');
      expect(command.dto.organizationId).toBe('org-457');
      expect(command.dto.wellId).toBe('well-790');
      expect(command.dto.reportDate).toBe('2024-03-16');
      expect(command.dto.depthMd).toBeUndefined();
      expect(command.dto.depthTvd).toBeUndefined();
      expect(command.dto.rotatingHours).toBeUndefined();
      expect(command.dto.nptHours).toBeUndefined();
      expect(command.dto.dayCost).toBeUndefined();
      expect(command.dto.nextOperations).toBeUndefined();
      expect(command.dto.notes).toBeUndefined();
    });
  });

  describe('properties', () => {
    it('should have readonly dto property', () => {
      const command = new CreateDailyDrillingReportCommand(validDto);

      expect(command.dto).toBeDefined();
    });

    it('should maintain object reference for dto', () => {
      const command = new CreateDailyDrillingReportCommand(validDto);

      expect(command.dto).toBe(validDto);
    });
  });

  describe('DTO structure', () => {
    it('should accept DTO with all optional fields', () => {
      const dtoWithOptionals: CreateDailyDrillingReportDto = {
        id: 'report-125',
        organizationId: 'org-458',
        wellId: 'well-791',
        reportDate: '2024-03-17',
        depthMd: 5200,
        depthTvd: 5000,
        rotatingHours: 14.0,
        nptHours: 0,
        dayCost: 0,
        nextOperations: '',
        notes: '',
      };

      const command = new CreateDailyDrillingReportCommand(dtoWithOptionals);

      expect(command.dto.depthMd).toBe(5200);
      expect(command.dto.rotatingHours).toBe(14.0);
      expect(command.dto.nptHours).toBe(0);
      expect(command.dto.dayCost).toBe(0);
      expect(command.dto.nextOperations).toBe('');
      expect(command.dto.notes).toBe('');
    });

    it('should handle zero values for numeric fields', () => {
      const dtoWithZeros: CreateDailyDrillingReportDto = {
        id: 'report-126',
        organizationId: 'org-459',
        wellId: 'well-792',
        reportDate: '2024-03-18',
        depthMd: 0,
        depthTvd: 0,
        rotatingHours: 0,
        nptHours: 0,
        dayCost: 0,
      };

      const command = new CreateDailyDrillingReportCommand(dtoWithZeros);

      expect(command.dto.depthMd).toBe(0);
      expect(command.dto.depthTvd).toBe(0);
      expect(command.dto.rotatingHours).toBe(0);
      expect(command.dto.nptHours).toBe(0);
      expect(command.dto.dayCost).toBe(0);
    });
  });

  describe('immutability', () => {
    it('should maintain consistent dto reference', () => {
      const command = new CreateDailyDrillingReportCommand(validDto);

      const dto1 = command.dto;
      const dto2 = command.dto;

      expect(dto1).toBe(dto2);
      expect(dto1.id).toBe(dto2.id);
    });
  });
});
