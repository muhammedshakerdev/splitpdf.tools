from pdf import split
from updates import Updates
from dotenv import load_dotenv
import os 

load_dotenv()

UPDATES_ENDPOINT = os.getenv("UPDATES_ENDPOINT")
AUTH_KEY = os.getenv("WORKER_AUTH_KEY")

updates = Updates(UPDATES_ENDPOINT, AUTH_KEY)

def process(body):

    id = body['id']
    file = {
        'bucket': body['file']['bucket'],
        'key': body['file']['key'],
    }
    splits = body['splits']
   
    try:
        updates.push({'id': id, 'status': 'PROCESSING'})
        parts = split(file, splits)
        updates.push({'id': id, 'status': 'DONE', 'files': parts})
        return True
    
    except:
        updates.push({'id': id, 'status': 'FAILED'})
        return False