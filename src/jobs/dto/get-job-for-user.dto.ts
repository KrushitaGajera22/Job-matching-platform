import { PartialType } from '@nestjs/mapped-types';
import { GetJobsDto } from './get-job.dto';

export class GetJobForUser extends PartialType(GetJobsDto) {}
