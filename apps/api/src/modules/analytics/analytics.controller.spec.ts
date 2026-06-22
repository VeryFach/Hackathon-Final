import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller.js';
import { AnalyticsService } from './analytics.service.js';

describe('AnalyticsController', () => {
    let controller: AnalyticsController;

    const analyticsServiceMock = {
        getStakeholderDashboard: jest.fn(),
        getCollectorDashboard: jest.fn(),
        getDepositorDashboard: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AnalyticsController],
            providers: [
                {
                    provide: AnalyticsService,
                    useValue: analyticsServiceMock,
                },
            ],
        }).compile();

        controller = module.get<AnalyticsController>(AnalyticsController);
    });

    it('should call stakeholder dashboard', async () => {
        analyticsServiceMock.getStakeholderDashboard.mockResolvedValue({});

        await controller.getStakeholderDashboard();

        expect(
            analyticsServiceMock.getStakeholderDashboard,
        ).toHaveBeenCalled();
    });

    it('should call collector dashboard', async () => {
        analyticsServiceMock.getCollectorDashboard.mockResolvedValue({});

        await controller.getCollectorDashboard('user-1');

        expect(
            analyticsServiceMock.getCollectorDashboard,
        ).toHaveBeenCalledWith('user-1');
    });

    it('should call depositor dashboard', async () => {
        analyticsServiceMock.getDepositorDashboard.mockResolvedValue({});

        await controller.getDepositorDashboard('user-1');

        expect(
            analyticsServiceMock.getDepositorDashboard,
        ).toHaveBeenCalledWith('user-1');
    });
});