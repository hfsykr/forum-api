const ForbiddenError = require('../ForbiddenError');
const ClientError = require('../ClientError');

describe('ForbiddenError', () => {
  it('should create ForbiddenError correctly', () => {
    const forbiddenError = new ForbiddenError('forbidden error!');

    expect(forbiddenError).toBeInstanceOf(ForbiddenError);
    expect(forbiddenError).toBeInstanceOf(ClientError);
    expect(forbiddenError).toBeInstanceOf(Error);

    expect(forbiddenError.statusCode).toEqual(403);
    expect(forbiddenError.message).toEqual('forbidden error!');
    expect(forbiddenError.name).toEqual('ForbiddenError');
  });
});
