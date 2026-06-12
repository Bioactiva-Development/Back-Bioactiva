from dataclasses import dataclass

@dataclass
class AuthSession:
    access_token: str | None = None
    refresh_token: str | None = None
