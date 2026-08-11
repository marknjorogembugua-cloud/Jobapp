import { BadRequestException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";

process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";

describe("AuthService", () => {
  const verifyIdToken = jest.fn();
  const firebaseApp = { auth: () => ({ verifyIdToken }) } as any;

  let usersService: jest.Mocked<UsersService>;
  let jwtService: JwtService;
  let service: AuthService;

  beforeEach(() => {
    usersService = {
      findByFirebaseUid: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    } as any;
    jwtService = new JwtService({});
    service = new AuthService(firebaseApp, usersService, jwtService);
    verifyIdToken.mockReset();
  });

  it("requires a role on first login for an unknown Firebase user", async () => {
    verifyIdToken.mockResolvedValue({ uid: "fb-1" });
    usersService.findByFirebaseUid.mockResolvedValue(null);

    await expect(
      service.createSession({ firebaseIdToken: "token" } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("creates a new user with the given role and issues tokens", async () => {
    verifyIdToken.mockResolvedValue({ uid: "fb-1", phone_number: "+254700000000" });
    usersService.findByFirebaseUid.mockResolvedValue(null);
    const created = {
      id: "user-1",
      role: "customer",
      firebaseUid: "fb-1",
      name: "Wanjiku",
      phone: "+254700000000",
      email: null,
      createdAt: new Date(),
    };
    usersService.create.mockResolvedValue(created as any);
    usersService.findById.mockResolvedValue(created as any);

    const result = await service.createSession({
      firebaseIdToken: "token",
      role: "customer",
      name: "Wanjiku",
    } as any);

    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({ firebaseUid: "fb-1", role: "customer" }),
    );
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.user).toEqual(created);
  });

  it("reuses tokens/session for an existing Firebase user without requiring a role", async () => {
    verifyIdToken.mockResolvedValue({ uid: "fb-2" });
    const existing = {
      id: "user-2",
      role: "worker",
      firebaseUid: "fb-2",
      name: "Otieno",
      phone: null,
      email: null,
      createdAt: new Date(),
    };
    usersService.findByFirebaseUid.mockResolvedValue(existing as any);
    usersService.findById.mockResolvedValue(existing as any);

    const result = await service.createSession({ firebaseIdToken: "token" } as any);

    expect(usersService.create).not.toHaveBeenCalled();
    expect(result.user).toEqual(existing);
  });
});
