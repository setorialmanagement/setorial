import { Controller, Get, Req, Res } from '@nestjs/common';
import { join } from 'path';

@Controller()
export class WebController {
  @Get('*')
  root(@Req() req: any, @Res() res: any) {
    const url = req.url || '';
    // Let API and admin routes return 404 here so other controllers handle them
    if (url.startsWith('/api') || url.startsWith('/admin') || url.startsWith('/auth') || url.startsWith('/_next')) {
      return res.status(404).send();
    }

    // Serve static files from web/public for paths starting with /public
    if (url.startsWith('/public/')) {
      const safePath = url.replace(/^\/public\//, '');
      const filePath = join(__dirname, '..', '..', 'web', 'public', safePath);
      return res.sendFile(filePath, (err: any) => {
        if (err) return res.status(404).send();
      });
    }

    const indexPath = join(__dirname, '..', '..', 'web', 'index.html');
    return res.sendFile(indexPath);
  }
}
