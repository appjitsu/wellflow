import {
  AndSpecification,
  ISpecification,
  SpecificationMetadata,
} from '../specification.interface';

describe('AndSpecification', () => {
  it('should be defined', () => {
    const dummySpec: ISpecification<any> = {
      isSatisfiedBy: () => Promise.resolve(true),
      getMetadata: (): SpecificationMetadata => ({
        name: 'dummy',
        description: 'dummy spec',
        priority: 1,
        category: 'test',
        tags: [],
      }),
      and: () => dummySpec,
      or: () => dummySpec,
      not: () => dummySpec,
    };

    const spec = new AndSpecification(dummySpec, dummySpec);
    expect(spec).toBeDefined();
    expect(spec.getMetadata().name).toContain('And');
  });
});
