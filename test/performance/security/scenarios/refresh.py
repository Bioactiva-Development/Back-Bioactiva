from locust import SequentialTaskSet, task

class RefreshScenario(SequentialTaskSet):
    @task
    def refresh(self):
        self.client.post(
            "/auth/refresh",
            name="/auth/refresh",
        )
