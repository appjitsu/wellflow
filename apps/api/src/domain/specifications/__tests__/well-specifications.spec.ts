import { ActiveWellsSpecification } from '../well-specifications';

describe('ActiveWellsSpecification', () => {
  let service: ActiveWellsSpecification;

  beforeEach(() => {
    service = new ActiveWellsSpecification();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
