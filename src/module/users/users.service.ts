import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUsersDTO } from './dto/create-users.dto';
import { UpdateUsersDTO } from './dto/update-users.dto';
@Injectable()
export class UsersService {
  private users = [
    {
      id: 1,
      username: 'Harry Nguyen',
      password: '123456',
      role: 'ADMIN',
    },
    {
      id: 2,
      username: 'John Doe',
      password: 'abcdef',
      role: 'USER',
    },
    {
      id: 3,
      username: 'Jane Smith',
      password: 'abcdef',
      role: 'USER',
    },
  ];

  findAll(role?: 'ADMIN' | 'USER') {
    if (role) {
      const roleArray = this.users.filter((user) => user.role === role);
      if (roleArray.length === 0) {
        throw new NotFoundException('No users found with the specified role');
      }
      return roleArray;
    }
    return this.users;
  }

  findOne(id: number) {
    const user = this.users.find((user) => user.id === id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  create(createUserDTO: CreateUsersDTO) {
    const usersByHighestId = [...this.users].sort((a, b) => b.id - a.id);
    const newUser = { id: usersByHighestId[0].id + 1, ...createUserDTO };
    this.users.push(newUser);
    return newUser;
  }

  update(id: number, updateUserDTO: UpdateUsersDTO) {
    const userIndex = this.users.map((user) => {
      if (user.id === id) {
        return { ...user, ...updateUserDTO };
      }
      return user;
    });
    return this.findOne(id);
  }

  remove(id: number) {
    const userIndex = this.users.findIndex((user) => user.id === id);
    if (userIndex === -1) {
      throw new Error(`User with id ${id} not found`);
    }
    this.users.splice(userIndex, 1);
    return { message: `User with id ${id} removed successfully` };
  }
}
