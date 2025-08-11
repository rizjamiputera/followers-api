import { SetMetadata } from '@nestjs/common';

export const PermissionsRequired = (module: string, ...permissions: string[]) =>
    SetMetadata('permissions', { module, permissions });
