import isTokenValid from "../../src/utils/jwtUtils";
jest.mock('jwt-decode', () => () => ({exp: 123}))

describe('Validation token', () => {
    test('invalid token', () => {
        const res = isTokenValid("token")
        expect(res).toBe(false)
    })
});