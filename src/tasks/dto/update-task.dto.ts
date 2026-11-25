import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { TaskPriority, TaskStatus } from '../../generated/prisma/enums.js';
import {
  DESCRIPTION_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  trim,
} from './create-task.dto.js';

/** Skip validation only when the field is absent; `null` is still validated (and rejected). */
const isPresent = (_: object, value: unknown): boolean => value !== undefined;

/**
 * All fields are optional for PATCH. Written out instead of using PartialType()
 * because PartialType's @IsOptional() also accepts `null`, which would let
 * `{ "title": null }` through to the database for non-nullable columns.
 */
export class UpdateTaskDto {
  @ValidateIf(isPresent)
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(TITLE_MAX_LENGTH)
  title?: string;

  // `null` is allowed here on purpose: it clears the description.
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(DESCRIPTION_MAX_LENGTH)
  description?: string | null;

  @ValidateIf(isPresent)
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ValidateIf(isPresent)
  @IsEnum(TaskPriority)
  priority?: TaskPriority;
}
