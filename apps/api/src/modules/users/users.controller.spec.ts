import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

const mockUsersService = {
  getMe: jest.fn(),
  editUser: jest.fn(),
};

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });
  
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMe()', () => {
    it('should delegate to usersService.getMe with the userId from the JWT', async () => {
      const expectedUser = {
        id: 'uuid-789',
        email: 'charlie@example.com',
        fullName: 'Charlie Chaplin',
        role: 'masyarakat',
      };
      mockUsersService.getMe.mockResolvedValue(expectedUser);

      // The @GetUser('id') decorator extracts the user ID from the JWT payload.
      // In unit tests we pass it directly as a string argument.
      const result = await controller.getMe('uuid-789');

      expect(mockUsersService.getMe).toHaveBeenCalledWith('uuid-789');
      expect(mockUsersService.getMe).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedUser);
    });

    it('should propagate NotFoundException from the service', async () => {
      mockUsersService.getMe.mockRejectedValue(new Error('User not found'));

      await expect(controller.getMe('bad-id')).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('editUser()', () => {
    it('should delegate to usersService.editUser with userId and DTO', async () => {
      const updatedUser = {
        id: 'uuid-789',
        email: 'newemail@example.com',
        fullName: 'Charlie Chaplin',
        role: 'masyarakat',
      };
      mockUsersService.editUser.mockResolvedValue(updatedUser);

      const dto = { email: 'newemail@example.com' };
      const result = await controller.editUser('uuid-789', dto);

      expect(mockUsersService.editUser).toHaveBeenCalledWith('uuid-789', dto);
      expect(mockUsersService.editUser).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedUser);
    });

    it('should allow updating only the name field', async () => {
      const updatedUser = {
        id: 'uuid-789',
        email: 'charlie@example.com',
        fullName: 'New Name',
        role: 'masyarakat',
      };
      mockUsersService.editUser.mockResolvedValue(updatedUser);

      const dto = { name: 'New Name' };
      const result = await controller.editUser('uuid-789', dto);

      expect(mockUsersService.editUser).toHaveBeenCalledWith('uuid-789', dto);
      expect(result.fullName).toBe('New Name');
    });
  });
});
