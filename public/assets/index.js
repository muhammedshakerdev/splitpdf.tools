const file_input         = document.getElementById('file-input');
const file_input_group   = document.getElementById('file-input-group');
const upload_file_form   = document.getElementById('upload-form');
const select_file_form   = document.getElementById('select-file-form');
const file_metadata_name = document.getElementById('file-metadata-name');
const file_metadata_size = document.getElementById('file-metadata-size');

const cancel_selection_btn = document.getElementById('cancel-selection-btn');
const upload_btn = document.getElementById('upload-btn');





// ==================
// = File Selection =
// ==================

["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
    addEventListener(eventName, e => e.preventDefault());
});

file_input_group.addEventListener('click', () =>{
    
    file_input.click();
});

file_input_group.addEventListener('dragenter', function(){
    this.classList.add('dragover');
});

file_input_group.addEventListener('dragover', event =>{
    event.preventDefault();
});

file_input_group.addEventListener('dragleave', function(){
    this.classList.remove('dragover');
});

file_input_group.addEventListener('drop', event =>{
    event.preventDefault();
    file_input_group.classList.remove('dragover');

    const files = event.dataTransfer.files;

    if(!files) return;

    if(files.length > 1){
        pushNotification("Multiple files selected", "Please select one file");
        return;
    }

    const file = files[0];

    const isValidFile = validateFile(file);

    if(! isValidFile){
        file_input.value = null;
        return;
    }
        
    file_input.files = files;
    file_input.dispatchEvent(new Event("change", { bubbles: true })); 
    

    
    // 🧠 Why This Works
    // FileList itself cannot be constructed manually
    // But DataTransfer can generate a valid FileList
    // input.files can be assigned a FileList
    // So we "bridge" through DataTransfer

    // const file = new File(["Hello world"], "hello.txt", {
    // type: "text/plain",
    // });

    // const dt = new DataTransfer();
    // dt.items.add(file);

    // but this method does not trigger the "change" event, so we have to do it manually.

});



file_input.addEventListener('change', event =>{
    const selectedFile = event.target.files[0];

    const isValidFile = validateFile(selectedFile);

    if(! isValidFile){
        file_input.value = null;
        return;
    }

    
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

function formatFileName(name){

    if(name.length < 24) return name;

    const prefix = name.split('.')[0];
    return `${prefix.slice(0, 18)}...${prefix.slice(-6)}.pdf`;
}


function formatFileSize(bytes){
    return `${(bytes / 1_000_000).toFixed(2)}MB`;
}



// ===============
// = File Upload =
// ===============

upload_btn.addEventListener('click', async () =>{
    const file = file_input.files[0];
    
    upload_btn.disabled = true;
    cancel_selection_btn.disabled = true;

    upload_btn.classList.add('loading');
    try{
        
        const response = await upload(file);
        console.log(response);

    } catch(error){
        console.log('error uploading the file: ', error);
         upload_btn.disabled = false;
        cancel_selection_btn.disabled = false;

    } finally{
        upload_btn.classList.remove('loading');
    }
});


async function upload(file){

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

function validateFile(file){

    if(! file) return false;

    if(! file instanceof File){
        pushNotification("Invalid file", "Please select a valid file");
        return false;
    }

    if(file.type !== 'application/pdf'){
        pushNotification("Invalid file type", "Please select a valid pdf file (.pdf)");
        return false;
    }

    const MAX_UPLOAD_SIZE = 250_000_000;

    if(file.size > MAX_UPLOAD_SIZE){
        pushNotification("Too large file", "Selected file is too large (max size: 25MB)");
        return false;
    }

    return true;
}




// ===========
// = Toaster =
// ===========

function pushNotification(title, message){
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML =`      
        <div class="toast__content">
            <h4 class="toast__content__title">${title}</h4>
            <p class="toast__content__text">${message}</p>
        </div>
        <button class="toast__close-btn">
            close
        </button> `;
    
    toast.querySelector('.toast__close-btn').addEventListener('click', () =>{
        toast.remove();
    });

    let finishedAnimations = 0;
    toast.addEventListener('animationend', function(){
        finishedAnimations++;
        if(finishedAnimations === 2){
            this.remove();
        }
    });

    const toaster = document.querySelector('.toaster');

    if(toaster.childElementCount >= 3){
        toaster.lastElementChild.remove();
    } 

    toaster.prepend(toast);

}

