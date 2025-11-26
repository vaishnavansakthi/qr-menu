import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Product } from '../products/product.entity';
import { Order } from '../orders/order.entity';

@Entity('shops')
export class Shop {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column('decimal', { precision: 10, scale: 6 })
    latitude: number;

    @Column('decimal', { precision: 10, scale: 6 })
    longitude: number;

    @Column({ nullable: true })
    qrCodeUrl: string;

    @Column({ default: true })
    isActive: boolean;

    @ManyToOne(() => User, (user) => user.id)
    owner: User;

    @Column()
    ownerId: string;

    @OneToMany(() => Product, (product) => product.shop, { cascade: true })
    products: Product[];

    @OneToMany(() => Order, (order) => order.shop, { cascade: true })
    orders: Order[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
