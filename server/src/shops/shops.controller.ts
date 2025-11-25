import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Request } from '@nestjs/common';
import { ShopsService } from './shops.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('shops')
export class ShopsController {
    constructor(private readonly shopsService: ShopsService) { }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @Post()
    create(@Body() createShopDto: any, @Request() req) {
        // Super admin can assign to any admin, regular admin creates for themselves
        return this.shopsService.create(createShopDto, req.user.userId);
    }

    @Get()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    async findAll(@Request() req) {
        if (req.user.role === UserRole.SUPER_ADMIN) {
            return this.shopsService.findAll();
        }
        return this.shopsService.findByOwner(req.user.userId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.shopsService.findOne(id);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.SUPER_ADMIN)
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateShopDto: any) {
        return this.shopsService.update(id, updateShopDto);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @Delete(':id')
    async remove(@Param('id') id: string) {
        try {
            return await this.shopsService.remove(id);
        } catch (error) {
            console.error('Error deleting shop:', error);
            throw error;
        }
    }
}
