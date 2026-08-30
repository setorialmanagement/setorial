import { Controller, Get, Req, Res } from '@nestjs/common';
import { join } from 'path';

@Controller()
export class WebController {
  @Get('*')
  root(@Req() req: any, @Res() res: any) {
    const url = req.url || '';
    // Let API and admin routes return 404 here so other controllers handle them
    if (url.startsWith('/api') || url.startsWith('/admin') || url.startsWith('/auth') || url.startsWith('/public') || url.startsWith('/_next')) {
      return res.status(404).send();
    }

    const indexPath = join(__dirname, '..', '..', 'web', 'index.html');
    return res.sendFile(indexPath);
  }
}
