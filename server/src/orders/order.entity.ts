import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Shop } from '../shops/shop.entity';
import { Product } from '../products/product.entity';

export enum OrderStatus {
    PENDING = 'pending',
    PREPARING = 'preparing',
    READY = 'ready',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
}

@Entity('orders')
export class Order {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Shop, (shop) => shop.orders, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'shopId' })
    shop: Shop;

    @Column()
    shopId: string;

    @ManyToOne(() => User, (user) => user.id)
    user: User;

    @Column({ nullable: true })
    userId?: string;

    @Column({
        type: 'enum',
        enum: OrderStatus,
        default: OrderStatus.PENDING,
    })
    status: OrderStatus;

    @Column('decimal', { precision: 10, scale: 2 })
    totalAmount: number;

    @Column({ nullable: true })
    sessionId?: string;

    @Column({ nullable: true })
    customerName?: string;

    @Column({ nullable: true })
    customerContact?: string;

    @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { cascade: true })
    items: OrderItem[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

@Entity('order_items')
export class OrderItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'orderId' })
    order: Order;

    @ManyToOne(() => Product, (product) => product.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'productId' })
    product: Product;

    @Column()
    productId: string;

    @Column()
    quantity: number;

    @Column('decimal', { precision: 10, scale: 2 })
    price: number;
}
