import { Controller } from '@nestjs/common';
import { ThreadsService } from './threads.service';

@Controller('threads')
export class ThreadsController {
  constructor(private readonly threadsService: ThreadsService) {}
}
