import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('users')
export class UsersEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  username: string;

  @Column({ type: 'varchar' })
  password: string;

  @Column({ type: 'enum', enum: ['ADMIN', 'USER'] })
  role: 'ADMIN' | 'USER';
}
