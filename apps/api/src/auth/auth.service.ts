import { BadRequestException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as admin from "firebase-admin";
import { FIREBASE_ADMIN } from "../firebase/firebase-admin.provider";
import { UsersService } from "../users/users.service";
import { CreateSessionDto } from "./dto/create-session.dto";

export interface JwtPayload {
  sub: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(FIREBASE_ADMIN) private readonly firebaseApp: admin.app.App,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async createSession(dto: CreateSessionDto) {
    const decoded = await this.verifyFirebaseToken(dto.firebaseIdToken);

    let user = await this.usersService.findByFirebaseUid(decoded.uid);

    if (!user) {
      if (!dto.role) {
        throw new BadRequestException(
          "First login for this account — role is required (customer or worker).",
        );
      }
      user = await this.usersService.create({
        firebaseUid: decoded.uid,
        role: dto.role,
        name: dto.name ?? decoded.name ?? "New user",
        phone: decoded.phone_number ?? null,
        email: decoded.email ?? null,
      });
    }

    return this.issueTokens(user.id, user.role);
  }

  async refresh(refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException("User no longer exists");
    }

    return this.issueTokens(user.id, user.role);
  }

  private async verifyFirebaseToken(idToken: string) {
    try {
      return await this.firebaseApp.auth().verifyIdToken(idToken);
    } catch {
      throw new UnauthorizedException("Invalid Firebase ID token");
    }
  }

  private async issueTokens(userId: string, role: string) {
    const payload: JwtPayload = { sub: userId, role };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: "15m",
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: "30d",
    });
    const user = await this.usersService.findById(userId);
    return { accessToken, refreshToken, user };
  }
}
