
import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IngredientsService } from './ingredients.service';

@Controller('ingredients')
export class IngredientsController {
  constructor(
    private readonly ingredientsService: IngredientsService,
  ) {}

  @Get()
  findAll() {
    return this.ingredientsService.findAll();
  }
}
