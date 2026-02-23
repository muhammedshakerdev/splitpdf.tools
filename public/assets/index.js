const file_input         = document.getElementById('file-input');
const upload_file_form   = document.getElementById('upload-form');
const select_file_form   = document.getElementById('select-file-form');
const file_metadata_name = document.getElementById('file-metadata-name');
const file_metadata_size = document.getElementById('file-metadata-size');

const cancel_selection_btn = document.getElementById('cancel-selection-btn');
const upload_btn = document.getElementById('upload-btn');


file_input.addEventListener('change', event =>{
    const selectedFile = event.target.files[0];

    if(! selectedFile instanceof File || selectedFile.type !== 'application/pdf') return;
    
    
    select_file_form.style.display = 'none';
    upload_file_form.style.display = 'block';
    
    const {name, size} = selectedFile;
    file_metadata_name.innerText = formatFileName(name);
    file_metadata_size.innerText = formatFileSize(size);
});

cancel_selection_btn.addEventListener('click', () =>{
    file_input.value = null;
    select_file_form.style.display = 'block';
    upload_file_form.style.display = 'none';
});

upload_btn.addEventListener('click', async () =>{
    const file = file_input.files[0];
    
    upload_btn.disabled = true;
    cancel_selection_btn.disabled = true;

    upload_btn.classList.add('loading');
    try{
        
        const response = await upload(file);
        console.log(response)
    } catch(error){
        console.log('error uploading the file: ', error);

    } finally{
        upload_btn.classList.remove('loading');
    }
});


function formatFileName(name){

    if(name.length < 24) return name;

    const prefix = name.split('.')[0];
    return `${prefix.slice(0, 18)}...${prefix.slice(-6)}.pdf`;
}


function formatFileSize(bytes){
    return `${(bytes / 1_000_000).toFixed(2)}MB`;
}


async function upload(file){

    if(! isValidUpload(file)) return;

    const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
            "Content-Type": "application/octet-stream",
            "x-filename": file.name
        },
        body: file
    });

    const json = await response.json();
    
    return json;
}

function isValidUpload(file){

    const MAX_UPLOAD_SIZE = 250_000_000;

    if( !file || file.type !== 'application/pdf' || file.size > MAX_UPLOAD_SIZE) return false;

    return true;
}


function create_state(_default, onChage){
    let state = _default;

    function update(_state){
         state = _state;
        onChage(_state);
    }

    return [state, update];
}



