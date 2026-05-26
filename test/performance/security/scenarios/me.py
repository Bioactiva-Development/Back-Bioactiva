from locust import SequentialTaskSet, task

class MeScenario(SequentialTaskSet):
    @task
    def me(self):
        self.client.get(
            "/auth/me",
            name="/auth/me",
        )
