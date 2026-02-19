import pika
import json
from process import process

def callback(ch, method, properties, body):
    job = json.loads(body)
    success = process(job)
    if success:
        ch.basic_ack(delivery_tag=method.delivery_tag)
    

connection = pika.BlockingConnection(
    pika.ConnectionParameters('localhost')
)

channel = connection.channel()

channel.queue_declare(queue='pdfs', durable=True)

channel.basic_consume(
    queue='pdfs',
    on_message_callback=callback
)

print('[#] working..')
channel.start_consuming()