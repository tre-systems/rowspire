import { getCanonicalRedirectUrl } from './lib/canonical-host';

interface Env {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
}

export default {
  fetch(request: Request, env: Env): Response | Promise<Response> {
    const redirectUrl = getCanonicalRedirectUrl(request.url);

    if (redirectUrl) {
      return Response.redirect(redirectUrl, 301);
    }

    return env.ASSETS.fetch(request);
  },
};
