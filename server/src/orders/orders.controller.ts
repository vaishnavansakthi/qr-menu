import { Controller, Get, Post, Body, Param, Patch, UseGuards, Request, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { OrderStatus } from './order.entity';

@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @UseGuards(AuthGuard('jwt'))
    @Post()
    create(@Body() createOrderDto: any, @Request() req) {
        return this.ordersService.create(createOrderDto, req.user.userId);
    }

    @Post('guest')
    createGuest(@Body() createOrderDto: any) {
        return this.ordersService.create(createOrderDto);
    }

    @Get('guest')
    findGuestOrders(@Query('shopId') shopId: string, @Query('sessionId') sessionId: string) {
        return this.ordersService.findBySession(shopId, sessionId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get()
    findAll(@Request() req, @Query('shopId') shopId: string) {
        // If user is admin/super_admin, they can see all orders for a shop
        // If user is customer, they can only see their own orders
        if (req.user.role === UserRole.USER) {
            return this.ordersService.findAll(shopId, req.user.userId);
        }
        return this.ordersService.findAll(shopId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.ordersService.findOne(id);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    @Patch(':id/status')
    updateStatus(@Param('id') id: string, @Body('status') status: OrderStatus) {
        return this.ordersService.updateStatus(id, status);
    }
}
