import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';

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
}
