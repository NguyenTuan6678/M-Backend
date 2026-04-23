import { Controller, Get, Param } from '@nestjs/common';

@Controller('users')
export class UsersController {
  /*
    // POST /users
    // PUT /users/:id
    // DELETE /users/:id
    // PATCH /users/:id
    */

  @Get() // GET /users
  findAll() {
    return [];
  }

  @Get(':id') // GET /users/:id
  findOne(@Param('id') id: string) {
    return { id };
  }
}
