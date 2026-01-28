from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import RedirectResponse


class HttpsRedirectFixMiddleware(BaseHTTPMiddleware):
    """Fixes proxy-generated redirects to http:// by forcing https in Location headers."""

    async def dispatch(self, request, call_next):
        response = await call_next(request)
        location = response.headers.get("location")
        if location and location.startswith("http://"):
            response.headers["location"] = "https://" + location[len("http://") :]
        return response
