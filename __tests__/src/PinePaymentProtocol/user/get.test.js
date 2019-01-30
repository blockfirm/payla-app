import getUser from '../../../../src/PinePaymentProtocol/user/get';

global.fetch = jest.fn(() => Promise.resolve({
  ok: true,
  json: () => ({
    id: '6f9ec449-269a-4b4f-aa79-732259b1f316',
    username: 'timothy'
  })
}));

describe('get', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('is a function', () => {
    expect(typeof getUser).toBe('function');
  });

  it('accepts one argument', () => {
    expect(getUser.length).toBe(1);
  });

  describe('when getting user with address "timothy@pine.cash"', () => {
    let address;
    let returnedPromise;

    beforeEach(() => {
      address = 'timothy@pine.cash';
      returnedPromise = getUser(address);
    });

    it('returns a promise', () => {
      expect(returnedPromise).toBeInstanceOf(Promise);
    });

    it('resolves to a user returned in the response', () => {
      expect.hasAssertions();

      return returnedPromise.then((user) => {
        expect(typeof user).toBe('object');

        // These values has been mocked at the top.
        expect(user.id).toBe('6f9ec449-269a-4b4f-aa79-732259b1f316');
        expect(user.username).toBe('timothy');
      });
    });

    describe('the HTTP request', () => {
      it('is made to the url https://_pine.pine.cash/v1/users/timothy', () => {
        const expectedUrl = 'https://_pine.pine.cash/v1/users/timothy';
        expect(fetch).toHaveBeenCalledWith(expectedUrl);
      });
    });

    describe('when the response is missing an id', () => {
      beforeEach(() => {
        global.fetch.mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => ({})
        }));
      });

      it('rejects the returned promise with an error', () => {
        expect.hasAssertions();

        return getUser(address).catch((error) => {
          expect(error).toBeTruthy();
          expect(error.message).toContain('Unknown error');
        });
      });
    });

    describe('when the response is an error', () => {
      beforeEach(() => {
        global.fetch.mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => ({
            error: 'ac094566-7887-48e4-9e67-4173a47e7241'
          })
        }));
      });

      it('rejects the returned promise with the error message from the response', () => {
        expect.hasAssertions();

        return getUser(address).catch((error) => {
          expect(error).toBeTruthy();
          expect(error.message).toBe('ac094566-7887-48e4-9e67-4173a47e7241');
        });
      });
    });
  });
});
