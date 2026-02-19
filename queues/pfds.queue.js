const amqp = require('amqplib');

async function produce(job) {
  let connection;
  let channel;

  try {
    connection = await amqp.connect("amqp://localhost");
    channel = await connection.createChannel();

    await channel.assertQueue("pdfs", { durable: true });

    const ok = channel.sendToQueue(
      "pdfs",
      Buffer.from(JSON.stringify(job)),
      {
        contentType: "application/json",
        persistent: true,
        headers: { source: "node-producer" },
      }
    );

    if (!ok) {
      throw new Error("RabbitMQ buffer full");
    }

  } catch (err) {
    console.error("Failed to publish job", err);
    throw err;

  } finally {
    if (channel) await channel.close();
    if (connection) await connection.close();
  }
}



module.exports = produce;