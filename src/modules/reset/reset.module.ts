import { Module } from '@nestjs/common';
import { ResetController } from '@/modules/reset/infrastructure/http/reset.controller';
import { ResetService } from '@/modules/reset/application/reset.service';
import { UsersModule } from '@/modules/users/user.module';

@Module({
    imports: [UsersModule],
    controllers: [ResetController],
    providers: [ResetService],
})
export class ResetModule {}
