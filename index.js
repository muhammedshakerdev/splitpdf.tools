const express = require('express');
const fs = require('fs');
const { randomBytes } = require('crypto');
const { join } = require('path');
const { PrismaClient } = require('@prisma/client');


const Schemas = require('./utils/schemas');
const produce = require('./queues/pfds.queue');
const workerAuth = require('./middlewares/worker-auth');
const { JOB_STAUTS } = require('./constants/status');

const prisma = new PrismaClient();
const app = express();

app.use(express.static('./public'));

app.use((request, response, next) => {
    if (request.headers['content-type'] === 'application/octet-stream') {
        next();

    } else {
        express.json()(request, response, next);
    }
});


app.post('/api/upload', (request, response) =>{

    const MAX_UPLOAD_SIZE = 25_000_000;

    if(request.headers['content-type'] !== 'application/octet-stream'){

        return response.status(400).json({
            success: false,
            error: 'Invalid content type.'
        });

    }

    const contentLength = request.headers['content-length'];
    const fileName = request.headers['x-filename'] || 'file';

    if(!contentLength || parseInt(contentLength) <= 0){

        return response.status(400).json({
            success: false,
            error: 'File is empty.'
        });

    } 

    if(parseInt(contentLength) > MAX_UPLOAD_SIZE){

        return response.status(413).json({
            success: false,
            error: 'File too large.'
        });

    } 


    const key = `${randomBytes(16).toString('hex')}.pdf`;
    const destination = join(__dirname, 'storage', 'uploads', key);


    const writeStream = fs.createWriteStream(destination);

    request.on('error', () =>{  

        writeStream.destroy();

        fs.unlink(destination, unlinkError =>{
            if(unlinkError) console.error('Failed to delete partial file:', unlinkError);
        });

    });

    request.on('aborted', () =>{

        writeStream.destroy();

        fs.unlink(destination, unlinkError =>{
            if(unlinkError) console.error('Failed to delete partial file:', unlinkError);
        });

    });


    let streamError = false;
    let streamFinished = false;


    writeStream.on('error', (error) =>{

        console.error(error);

        streamError = true;

        fs.unlink(destination, unlinkError =>{
            if(unlinkError) console.error('Failed to delete partial file:', unlinkError);
        });

    })
    
    writeStream.on('finish', () =>{
        streamFinished = true;

    });

    writeStream.on('close', async () =>{

        if(streamError){

            return response.status(500).json({
                success: false,
                error: 'Upload faild.'
            });

        } else if (streamFinished){

            const { id } = await prisma.file.create({data: {
                name: fileName,
                size: parseInt(contentLength),
                status: 'UPLOADED',
                bucket: 'uploads',
                key
            }});

            return response.status(200).json({
                success: true,
                id,
                message: 'File uploaded successfully.'
            });
        } else {
            console.error('Stream closed without finish or error');
            return response.status(500).json({
                success: false,
                error: 'Upload failed unexpectedly.'
            });
        }
    });


    request.pipe(writeStream);


});


app.post('/api/queue', async (request, response) =>{

    const proccess = request.body;


    if(!proccess || ! Schemas.match('proccess', proccess)){
        return response.status(400).json({
            success: false,
            message: 'Invalid request.'
        });
    }


    const file = await prisma.file.findUnique({
        where: {id: proccess.file}
    })

    if(! file){
        return response.status(400).json({
            success: false,
            message: 'File not found.'
        });
    }


    try{

        const job = await prisma.job.create({data: {
            fileId: file.id,
            splits: proccess.params.splits,
            outputFiles: []
        }});

        response.status(200).json({
            success: true,
            message: 'Job created successfuly.',
            job
        });


        try{

            job.file = file;
            await produce(job);

            await prisma.job.update({
                where: {id: job.id},
                data: {status: "ENQUEUED"}
            })

        } catch(error){
            console.error('Faild to enqueue job: ', error);
        }


    } catch(error){

        console.error("Faild to create job: ", error);

        return response.status(500).json({
            success: false,
            message: 'Failed to create job, try again.'
        });

    }

});


app.get('/api/jobs/:id', async (request, response) =>{ 

    const id = request.params.id;

    const job = await prisma.job.findUnique({
        where: {id}
    });

    if(job){
        
        return response.status(200).json({
            success: true,
            job
        });

    } else{

        return response.status(404).json({
            success: false,
            message: 'Job not found.'
        });

    }

});


app.get('/api/files/:id', async (request, response) =>{
    const id = request.params.id;

    if(! Schemas.isValidUUID(id)){
        return response.status(400).json({
            message: "Invalid file id."
        })
    }
        

    const file = await prisma.file.findUnique({
        where: { id, status: "AVAILABLE"}
    });

    if(file){

        const {bucket, key, name} = file;
        const source = join(__dirname, 'storage', bucket, key);
    
        return response.download(source, name);
    }

    return response.status(401).json({
        message: "File not found or expired."
    })
});

app.post('/api/updates/job', workerAuth, async (request, response) =>{
    if(request.body)
        {

        const { id, status, files = [] } = request.body;

        if(! JOB_STAUTS.includes(status)){
            return  response.status(400).json({success: false, message: 'Invalid status.'});
        }

        const ids = [];

        
        if(files){
            
            try{

                // use transiction
                for(const file of files){
                    const { key, order } = file;
                    const name = `part-${order}.pdf`;

                    const { id: file_id } = await prisma.file.create({data: {
                        bucket: "processed",
                        key,
                        name,
                        status: "AVAILABLE",
                        size: 0
                    }});
                    ids.push(file_id);
                }

            } catch(error){

                console.error(error);
                response.status(500).json({success: false, message: 'Faild to update.'});
            }

        } 

        await prisma.job.update({
            where: {id: id},
            data: {
                status: status,
                outputFiles: ids
            }
        });

        return response.status(200).json({success: true, message: 'Updated successfly.'});
        
    }

    response.status(400).json({success: false, message: 'Missing job data.'});
});


const PORT = 3000;

app.listen(PORT, () => {
    console.log(`
===================================
= 🚀  Server Started Successfully =
= 📡  URL: http://localhost:${PORT}  =
===================================
    `);
});