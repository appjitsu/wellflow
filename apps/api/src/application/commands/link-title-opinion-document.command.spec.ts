import { LinkTitleOpinionDocumentCommand } from './link-title-opinion-document.command';

describe('LinkTitleOpinionDocumentCommand', () => {
  const validTitleOpinionId = 'opinion-123';
  const validDocumentId = 'doc-456';
  const validRole = 'supporting-evidence';
  const validPageRange = '1-5';
  const validNotes = 'Contains relevant title information';

  describe('constructor', () => {
    it('should create a command with required properties only', () => {
      const command = new LinkTitleOpinionDocumentCommand(
        validTitleOpinionId,
        validDocumentId,
        validRole,
      );

      expect(command.titleOpinionId).toBe(validTitleOpinionId);
      expect(command.documentId).toBe(validDocumentId);
      expect(command.role).toBe(validRole);
      expect(command.pageRange).toBeUndefined();
      expect(command.notes).toBeUndefined();
    });

    it('should create a command with all properties', () => {
      const command = new LinkTitleOpinionDocumentCommand(
        validTitleOpinionId,
        validDocumentId,
        validRole,
        validPageRange,
        validNotes,
      );

      expect(command.titleOpinionId).toBe(validTitleOpinionId);
      expect(command.documentId).toBe(validDocumentId);
      expect(command.role).toBe(validRole);
      expect(command.pageRange).toBe(validPageRange);
      expect(command.notes).toBe(validNotes);
    });

    it('should create a command with pageRange only', () => {
      const command = new LinkTitleOpinionDocumentCommand(
        validTitleOpinionId,
        validDocumentId,
        validRole,
        validPageRange,
      );

      expect(command.pageRange).toBe(validPageRange);
      expect(command.notes).toBeUndefined();
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new LinkTitleOpinionDocumentCommand(
        validTitleOpinionId,
        validDocumentId,
        validRole,
        validPageRange,
      );

      expect(command.titleOpinionId).toBeDefined();
      expect(command.documentId).toBeDefined();
      expect(command.role).toBeDefined();
      expect(command.pageRange).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty strings for optional properties', () => {
      const command = new LinkTitleOpinionDocumentCommand(
        validTitleOpinionId,
        validDocumentId,
        validRole,
        '',
        '',
      );

      expect(command.pageRange).toBe('');
      expect(command.notes).toBe('');
    });

    it('should handle undefined optional properties', () => {
      const command = new LinkTitleOpinionDocumentCommand(
        validTitleOpinionId,
        validDocumentId,
        validRole,
        undefined,
        undefined,
      );

      expect(command.pageRange).toBeUndefined();
      expect(command.notes).toBeUndefined();
    });

    it('should handle complex page ranges', () => {
      const complexPageRange = '1-5, 10-15, 20';
      const command = new LinkTitleOpinionDocumentCommand(
        validTitleOpinionId,
        validDocumentId,
        validRole,
        complexPageRange,
      );

      expect(command.pageRange).toBe(complexPageRange);
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const command = new LinkTitleOpinionDocumentCommand(
        validTitleOpinionId,
        validDocumentId,
        validRole,
        validPageRange,
      );

      const titleOpinionId1 = command.titleOpinionId;
      const titleOpinionId2 = command.titleOpinionId;
      const role1 = command.role;
      const role2 = command.role;

      expect(titleOpinionId1).toBe(titleOpinionId2);
      expect(role1).toBe(role2);
    });
  });
});
