import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { UpdateUsersDTO } from './dto/update-users.dto';
import { CreateUsersDTO } from './dto/create-users.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get() // GET /users
  findAll(@Query('role') role?: string) {
    return this.usersService.findAll(role as 'ADMIN' | 'USER');
  }

  @Get(':id') // GET /users/:id
  findOne(@Param('id', ParseIntPipe) id: string) {
    return this.usersService.findOne(+id);
  }

  @Post() // POST /users
  create(@Body(ValidationPipe) createUserDTO: CreateUsersDTO) {
    return this.usersService.create(createUserDTO);
  }

  @Patch(':id') // PATCH /users/:id
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateUserDTO: UpdateUsersDTO,
  ) {
    return this.usersService.update(id, updateUserDTO);
  }

  @Delete(':id') // DELETE /users/:id
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
