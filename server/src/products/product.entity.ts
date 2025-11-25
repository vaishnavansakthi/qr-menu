import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Shop } from '../shops/shop.entity';

@Entity('products')
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column('decimal', { precision: 10, scale: 2 })
    price: number;

    @Column({ nullable: true })
    description: string;

    @Column({ nullable: true })
    imageUrl: string;

    @ManyToOne(() => Shop, (shop) => shop.products, { onDelete: 'CASCADE' })
    shop: Shop;

    @Column()
    shopId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
