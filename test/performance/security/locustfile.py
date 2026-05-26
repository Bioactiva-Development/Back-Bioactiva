from locust import HttpUser, between

from scenarios.login import LoginScenario
from scenarios.me import MeScenario
from scenarios.refresh import RefreshScenario

"""
Security performance
--------------------
Responsable de:
- login
- refresh de sesión
- consulta del usuario autenticado
"""
# STATUS: Funcionalidad pendiente.
class SecurityUser(HttpUser):
    wait_time = between(1, 3)
    tasks = [LoginScenario, RefreshScenario, MeScenario]
