import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/user.entity';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, password: string): Promise<any> {
        const user = await this.usersService.findByEmail(email);
        if (user && await bcrypt.compare(password, user.password)) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = { email: user.email, sub: user.id, role: user.role, name: user.name };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    async register(userDto: Partial<User>) {
        const hashedPassword = await bcrypt.hash(userDto.password, 10);
        return this.usersService.create({
            ...userDto,
            password: hashedPassword,
        });
    }

    async validateGoogleUser(googleUser: any): Promise<any> {
        const user = await this.usersService.findByEmail(googleUser.email);
        if (user) {
            // If user exists but doesn't have googleId, update it
            if (!user.googleId) {
                user.googleId = googleUser.googleId;
                await this.usersService.create(user); // Save updates
            }
            return user;
        }
        // Create new user
        return this.usersService.create({
            email: googleUser.email,
            name: `${googleUser.firstName} ${googleUser.lastName}`,
            googleId: googleUser.googleId,
            password: '', // No password for Google users
            role: UserRole.USER, // Default role
        });
    }
}
