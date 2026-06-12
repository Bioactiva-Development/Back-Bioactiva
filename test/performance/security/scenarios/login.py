from locust import SequentialTaskSet, task

class LoginScenario(SequentialTaskSet):
    @task
    def login(self):
        self.client.post(
            "/auth/login",
            json={
                "correo": "test@example.com",
                "password": "password123",
            },
            name="/auth/login",
        )
