import requests

class Updates:
    def __init__(self, endpoint, key):
        self.endpoint = endpoint
        self.key = key
    
    def push(self, status):
        response = requests.post(
            self.endpoint,
            headers={ 'x-worker-key': self.key },
            json=status
        )
    