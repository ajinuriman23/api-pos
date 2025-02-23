import { MyOutletMiddleware } from './my-outlet.middleware';

describe('MyOutletMiddleware', () => {
  it('should be defined', () => {
    expect(new MyOutletMiddleware()).toBeDefined();
  });
});
