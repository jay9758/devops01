import { Test } from '@nestjs/testing';
import { TasksController } from './tasks.controller.js';
import { TasksService } from './tasks.service.js';

const TASK_ID = '6f1c1a52-6c2c-4a8e-9f0e-2a3b4c5d6e7f';

describe('TasksController', () => {
  let controller: TasksController;
  const tasksService = {
    findAll: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [{ provide: TasksService, useValue: tasksService }],
    }).compile();

    controller = moduleRef.get(TasksController);
  });

  it('delegates findAll to the service', async () => {
    tasksService.findAll.mockResolvedValue([]);
    await expect(controller.findAll()).resolves.toEqual([]);
  });

  it('delegates findOne with the id', async () => {
    tasksService.findOne.mockResolvedValue({ id: TASK_ID });
    await controller.findOne(TASK_ID);
    expect(tasksService.findOne).toHaveBeenCalledWith(TASK_ID);
  });

  it('delegates create with the DTO', async () => {
    const dto = { title: 'New task' };
    await controller.create(dto);
    expect(tasksService.create).toHaveBeenCalledWith(dto);
  });

  it('delegates update with the id and DTO', async () => {
    const dto = { status: 'IN_PROGRESS' as const };
    await controller.update(TASK_ID, dto);
    expect(tasksService.update).toHaveBeenCalledWith(TASK_ID, dto);
  });

  it('delegates remove with the id', async () => {
    await controller.remove(TASK_ID);
    expect(tasksService.remove).toHaveBeenCalledWith(TASK_ID);
  });
});
