import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { IsBoolean, IsNotEmpty, IsString } from "class-validator";
import { UsersService } from "./users.service";
import { NotificationsService } from "../notifications/notifications.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser, RequestUser } from "../auth/decorators/current-user.decorator";

class SetSuspendedDto {
  @IsBoolean()
  suspended!: boolean;
}

class RegisterPushTokenDto {
  @IsString()
  @IsNotEmpty()
  token!: string;
}

@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Patch(":id/suspend")
  setSuspended(@Param("id") id: string, @Body() dto: SetSuspendedDto) {
    return this.usersService.setSuspended(id, dto.suspended);
  }

  // Any authenticated role may register their own device's push token.
  @Patch("me/push-token")
  @Roles()
  async registerPushToken(@CurrentUser() user: RequestUser, @Body() dto: RegisterPushTokenDto) {
    await this.notificationsService.registerToken(user.userId, dto.token);
    return { ok: true };
  }
}
