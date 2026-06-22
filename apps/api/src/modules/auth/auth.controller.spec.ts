import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const createMockResponse = () =>
  ({
    cookie: jest.fn(),
    clearCookie: jest.fn(),
    redirect: jest.fn(),
  }) as unknown as {
    cookie: jest.Mock;
    clearCookie: jest.Mock;
    redirect: jest.Mock;
  };

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  googleLogin: jest.fn(),
  getMe: jest.fn(),
};

const makeRegisterDto = (overrides = {}) => ({
  email: 'alice@example.com',
  password: 'strongP@ss1',
  fullName: 'Alice Wonderland',
  ...overrides,
});

const makeLoginDto = (overrides = {}) => ({
  email: 'alice@example.com',
  password: 'strongP@ss1',
  ...overrides,
});

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register()', () => {
    it('should call authService.register, set a cookie, and return the token', async () => {
      const tokenData = {
        access_token: 'jwt.token.here',
        user: {
          id: 'uuid-1',
          email: 'alice@example.com',
          fullName: 'Alice Wonderland',
          role: 'masyarakat',
        },
      };
      mockAuthService.register.mockResolvedValue(tokenData);

      const dto = makeRegisterDto();
      const res = createMockResponse();

      const result = await controller.register(dto, res as any);

      // Assert – service was called with the DTO.
      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
      expect(mockAuthService.register).toHaveBeenCalledTimes(1);

      // Assert – an httpOnly auth cookie was set.
      expect(res.cookie).toHaveBeenCalledWith(
        'cookie_token',
        'jwt.token.here',
        expect.objectContaining({
          httpOnly: true,
          path: '/',
        }),
      );

      // Assert – the token data is returned to the client.
      expect(result).toEqual(tokenData);
    });
  });

  describe('login()', () => {
    it('should call authService.login, set a cookie, and return the token', async () => {
      const tokenData = {
        access_token: 'jwt.login.token',
        user: {
          id: 'uuid-1',
          email: 'alice@example.com',
          fullName: 'Alice Wonderland',
          role: 'masyarakat',
        },
      };
      mockAuthService.login.mockResolvedValue(tokenData);

      const dto = makeLoginDto();
      const res = createMockResponse();

      const result = await controller.login(dto, res as any);

      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
      expect(res.cookie).toHaveBeenCalledWith(
        'cookie_token',
        'jwt.login.token',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(result).toEqual(tokenData);
    });

    it('should propagate ForbiddenException from the service', async () => {
      mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));
      const res = createMockResponse();

      await expect(controller.login(makeLoginDto(), res as any)).rejects.toThrow(
        'Invalid credentials',
      );

      // Cookie should NOT be set when login fails.
      expect(res.cookie).not.toHaveBeenCalled();
    });
  });

  describe('logout()', () => {
    it('should clear the auth cookie and return a success message', () => {
      const res = createMockResponse();

      const result = controller.logout(res as any);

      expect(res.clearCookie).toHaveBeenCalledWith(
        'cookie_token',
        expect.objectContaining({
          httpOnly: true,
          path: '/',
        }),
      );
      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });

  describe('getMe()', () => {
    it('should return fresh user data for the authenticated user', async () => {
      const user = {
        id: 'uuid-1',
        email: 'alice@example.com',
        fullName: 'Alice Wonderland',
        role: 'masyarakat',
      };
      mockAuthService.getMe.mockResolvedValue(user);

      const result = await controller.getMe({ user: { sub: 'uuid-1' } });

      expect(mockAuthService.getMe).toHaveBeenCalledWith('uuid-1');
      expect(result).toEqual(user);
    });
  });

  describe('googleAuth()', () => {
    it('should be defined (guard handles the redirect to Google)', () => {
      // The GoogleGuard triggers the OAuth2 redirect; the controller body is
      // intentionally empty.  We just verify the method exists.
      expect(controller.googleAuth).toBeDefined();
    });
  });

  describe('googleAuthRedirect()', () => {
    it('should call googleLogin, set cookie, and redirect to frontend', async () => {
      const tokenData = {
        access_token: 'google.jwt.token',
        user: {
          id: 'uuid-1',
          email: 'google@example.com',
          fullName: 'Google User',
          role: 'masyarakat',
        },
      };
      mockAuthService.googleLogin.mockResolvedValue(tokenData);

      const req = { user: { email: 'google@example.com' } };
      const res = createMockResponse();

      await controller.googleAuthRedirect(req, res as any);

      expect(mockAuthService.googleLogin).toHaveBeenCalledWith(req);
      expect(res.cookie).toHaveBeenCalledWith(
        'cookie_token',
        'google.jwt.token',
        expect.objectContaining({ httpOnly: true }),
      );

      // Assert – user is redirected to the frontend with the token in the URL.
      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('auth/callback?token=google.jwt.token'),
      );
    });
  });
});
