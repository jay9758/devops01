import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateTaskDto } from './create-task.dto.js';
import { UpdateTaskDto } from './update-task.dto.js';

async function errorsFor<T extends object>(
  cls: new () => T,
  payload: Record<string, unknown>,
): Promise<string[]> {
  const errors = await validate(plainToInstance(cls, payload));
  return errors.map((error) => error.property);
}

describe('CreateTaskDto', () => {
  it('accepts a minimal valid payload', async () => {
    await expect(errorsFor(CreateTaskDto, { title: 'Task' })).resolves.toEqual(
      [],
    );
  });

  it('requires a non-blank title', async () => {
    await expect(errorsFor(CreateTaskDto, {})).resolves.toEqual(['title']);
    await expect(errorsFor(CreateTaskDto, { title: '   ' })).resolves.toEqual([
      'title',
    ]);
  });

  it('trims the title', () => {
    const dto = plainToInstance(CreateTaskDto, { title: '  Task  ' });
    expect(dto.title).toBe('Task');
  });

  it('rejects titles longer than 200 characters', async () => {
    await expect(
      errorsFor(CreateTaskDto, { title: 'a'.repeat(201) }),
    ).resolves.toEqual(['title']);
  });

  it('rejects unknown status and priority values', async () => {
    await expect(
      errorsFor(CreateTaskDto, {
        title: 'Task',
        status: 'DONE',
        priority: 'URGENT',
      }),
    ).resolves.toEqual(['status', 'priority']);
  });
});

describe('UpdateTaskDto', () => {
  it('accepts an empty payload', async () => {
    await expect(errorsFor(UpdateTaskDto, {})).resolves.toEqual([]);
  });

  it('accepts a partial payload', async () => {
    await expect(
      errorsFor(UpdateTaskDto, { status: 'COMPLETED' }),
    ).resolves.toEqual([]);
  });

  it('rejects null for non-nullable fields', async () => {
    await expect(
      errorsFor(UpdateTaskDto, { title: null, status: null, priority: null }),
    ).resolves.toEqual(['title', 'status', 'priority']);
  });

  it('allows null description to clear it', async () => {
    await expect(
      errorsFor(UpdateTaskDto, { description: null }),
    ).resolves.toEqual([]);
  });
});
