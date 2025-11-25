import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Shop } from '../shops/shop.entity';

export enum UserRole {
    USER = 'user',
    ADMIN = 'admin',
    SUPER_ADMIN = 'super_admin',
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string; // Hashed password

    @Column({ nullable: true })
    name: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.USER,
    })
    role: UserRole;

    @OneToMany(() => Shop, (shop) => shop.owner)
    shops: Shop[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
