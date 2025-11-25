import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderItem, OrderStatus } from './order.entity';

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(Order)
        private ordersRepository: Repository<Order>,
        @InjectRepository(OrderItem)
        private orderItemsRepository: Repository<OrderItem>,
    ) { }

    async create(createOrderDto: any, userId?: string): Promise<Order> {
        const { items, shopId, totalAmount, sessionId, customerName, customerContact } = createOrderDto;

        const order = this.ordersRepository.create({
            shopId,
            userId,
            totalAmount,
            status: OrderStatus.PENDING,
            sessionId,
            customerName,
            customerContact,
        });

        const savedOrder = await this.ordersRepository.save(order);

        const orderItems = items.map((item) =>
            this.orderItemsRepository.create({
                order: savedOrder,
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
            }),
        );

        await this.orderItemsRepository.save(orderItems);

        return this.findOne(savedOrder.id);
    }

    findAll(shopId?: string, userId?: string, sessionId?: string): Promise<Order[]> {
        const where: any = {};
        if (shopId) where.shopId = shopId;
        if (userId) where.userId = userId;
        if (sessionId) where.sessionId = sessionId;

        return this.ordersRepository.find({
            where,
            relations: ['items', 'items.product', 'user', 'shop'],
            order: { createdAt: 'DESC' },
        });
    }

    findBySession(shopId?: string, sessionId?: string): Promise<Order[]> {
        if (!shopId || !sessionId) {
            return Promise.resolve([]);
        }

        return this.findAll(shopId, undefined, sessionId);
    }

    findOne(id: string): Promise<Order | null> {
        return this.ordersRepository.findOne({
            where: { id },
            relations: ['items', 'items.product', 'user', 'shop'],
        });
    }

    async updateStatus(id: string, status: OrderStatus): Promise<Order> {
        await this.ordersRepository.update(id, { status });
        return this.findOne(id);
    }
}
