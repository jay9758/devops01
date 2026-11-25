import { Injectable, NotFoundException } from '@nestjs/common';
import type { Task } from '../generated/prisma/client.js';
import { isRecordNotFoundError } from '../prisma/prisma-errors.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Task[]> {
    return this.prisma.task.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) {
      throw this.notFound(id);
    }
    return task;
  }

  create(dto: CreateTaskDto): Promise<Task> {
    return this.prisma.task.create({ data: dto });
  }

  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    try {
      return await this.prisma.task.update({ where: { id }, data: dto });
    } catch (error) {
      if (isRecordNotFoundError(error)) {
        throw this.notFound(id);
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.task.delete({ where: { id } });
    } catch (error) {
      if (isRecordNotFoundError(error)) {
        throw this.notFound(id);
      }
      throw error;
    }
  }

  private notFound(id: string): NotFoundException {
    return new NotFoundException(`Task with id "${id}" was not found`);
  }
}
