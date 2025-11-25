import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { ShopsService } from '../../shops/shops.service';

@Injectable()
export class LocationGuard implements CanActivate {
    constructor(private shopsService: ShopsService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const { latitude, longitude, shopId } = request.body; // Or headers

        if (!latitude || !longitude || !shopId) {
            // For now, allow if location is missing (dev mode) or throw error
            // throw new BadRequestException('Location and Shop ID are required');
            return true;
        }

        const shop = await this.shopsService.findOne(shopId);
        if (!shop) {
            throw new BadRequestException('Shop not found');
        }

        const distance = this.calculateDistance(latitude, longitude, shop.latitude, shop.longitude);

        // 200 meters = 0.2 km
        if (distance > 0.2) {
            throw new BadRequestException('You are too far from the shop to order.');
        }

        return true;
    }

    // Haversine formula
    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Radius of the earth in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return d;
    }

    private deg2rad(deg: number): number {
        return deg * (Math.PI / 180);
    }
}
