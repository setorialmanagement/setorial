import { Controller, Get, Req, Res } from '@nestjs/common';
import { join } from 'path';
import { existsSync } from 'fs';

@Controller()
export class WebController {
  @Get('*')
  root(@Req() req: any, @Res() res: any) {
    const url = req.url || '';
    // Let API/auth/_next routes fall through to controllers
    if (url.startsWith('/api') || url.startsWith('/auth') || url.startsWith('/_next')) {
      return res.status(404).send();
    }

    // Serve admin SPA and its assets from admin/dist when present
    // Serve admin index for any /admin/* client route so SPA can handle routing
    if (url === '/admin' || url.startsWith('/admin/')) {
      const safePath = url.replace(/^\/admin\/?/, '');
      // If requesting a specific file inside admin/dist, try to serve it
      if (safePath) {
        const filePath = join(__dirname, '..', '..', 'admin', 'dist', safePath);
        if (existsSync(filePath)) {
          return res.sendFile(filePath, (err: any) => { if (err) return res.status(404).send(); });
        }
      }

      // Fallback to admin index.html
      const adminIndex = join(__dirname, '..', '..', 'admin', 'dist', 'index.html');
      if (existsSync(adminIndex)) return res.sendFile(adminIndex);
    }

    // Serve admin assets referenced at root (e.g. /assets/... , /logo.png)
    if (url.startsWith('/assets/') || url === '/logo.png') {
      const assetPath = url.replace(/^\//, '');
      const candidate = join(__dirname, '..', '..', 'admin', 'dist', assetPath);
      if (existsSync(candidate)) {
        return res.sendFile(candidate, (err: any) => { if (err) return res.status(404).send(); });
      }
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
