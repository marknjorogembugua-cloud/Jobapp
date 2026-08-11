import { Injectable } from "@nestjs/common";
import { User, UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByFirebaseUid(firebaseUid: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { firebaseUid } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findAll(): Promise<User[]> {
    return this.prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  }

  setSuspended(id: string, suspended: boolean): Promise<User> {
    return this.prisma.user.update({ where: { id }, data: { suspended } });
  }

  create(params: {
    firebaseUid: string;
    role: UserRole;
    name: string;
    phone?: string | null;
    email?: string | null;
  }): Promise<User> {
    return this.prisma.user.create({
      data: {
        firebaseUid: params.firebaseUid,
        role: params.role,
        name: params.name,
        phone: params.phone ?? null,
        email: params.email ?? null,
      },
    });
  }
}
