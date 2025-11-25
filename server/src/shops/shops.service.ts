import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shop } from './shop.entity';
import * as QRCode from 'qrcode';

@Injectable()
export class ShopsService {
    constructor(
        @InjectRepository(Shop)
        private shopsRepository: Repository<Shop>,
    ) { }

    async create(createShopDto: Partial<Shop> & { ownerId?: string }, creatorId?: string): Promise<Shop> {
        // Use provided ownerId if available, otherwise use creatorId (for backward compatibility)
        const ownerId = createShopDto.ownerId || creatorId;
        const shop = this.shopsRepository.create({ ...createShopDto, ownerId });
        const savedShop = await this.shopsRepository.save(shop);

        // Generate QR Code URL (pointing to frontend)
        // Assuming frontend runs on localhost:5173 for MVP
        const qrData = `http://localhost:5173/menu/${savedShop.id}`;
        savedShop.qrCodeUrl = await QRCode.toDataURL(qrData);

        return this.shopsRepository.save(savedShop);
    }

    findAll(): Promise<Shop[]> {
        return this.shopsRepository.find();
    }

    findOne(id: string): Promise<Shop | null> {
        return this.shopsRepository.findOneBy({ id });
    }

    async findByOwner(ownerId: string): Promise<Shop[]> {
        return this.shopsRepository.findBy({ ownerId });
    }

    async update(id: string, updateShopDto: Partial<Shop>): Promise<Shop> {
        await this.shopsRepository.update(id, updateShopDto);
        return this.shopsRepository.findOneBy({ id });
    }

    async remove(id: string): Promise<void> {
        await this.shopsRepository.delete(id);
    }
}
