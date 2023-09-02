import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller()
@ApiTags('Welcome')
export class AppController {
  @Get()
  @ApiOperation({
    summary: 'Welcome message',
    description: 'Welcome message to our Backend API.',
  })
  getHello() {
    return {
      message: 'Welcome to Student Awards Backend',
      documentation: 'https://mcsa.up.railway.app/api/v1/docs',
      frontend: 'https://mcsa.com',
    };
  }
}
