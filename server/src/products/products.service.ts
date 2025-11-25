import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';

@Injectable()
export class ProductsService {
    constructor(
        @InjectRepository(Product)
        private productsRepository: Repository<Product>,
    ) { }

    create(createProductDto: Partial<Product>): Promise<Product> {
        const product = this.productsRepository.create(createProductDto);
        return this.productsRepository.save(product);
    }

    findAll(shopId?: string): Promise<Product[]> {
        if (shopId) {
            return this.productsRepository.findBy({ shopId });
        }
        return this.productsRepository.find();
    }

    findOne(id: string): Promise<Product | null> {
        return this.productsRepository.findOneBy({ id });
    }

    async update(id: string, updateProductDto: Partial<Product>): Promise<Product> {
        await this.productsRepository.update(id, updateProductDto);
        return this.productsRepository.findOneBy({ id });
    }

    async remove(id: string): Promise<void> {
        await this.productsRepository.delete(id);
    }
}
