const LOADING_STATE = {
    isLoading: false,
    prevent: false,
    error: null
};

function setLoading(state){
    if(! [true, false].includes(state)) return;
    LOADING_STATE.isLoading = state

    rerender();
}

function rerender(){

    document.getElementById('upload-button').disable = LOADING_STATE.isLoading ||  LOADING_STATE.prevent;
    document.getElementById('upload-status').style.display = LOADING_STATE.isLoading ? 'block' : 'none';
    return null;
}


async function upload(){

    const input = document.getElementById('file');
    const file = input.files[0];
    
    if(! isValidUpload(file)) return;

    setLoading(true);
    const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
            "Content-Type": "application/octet-stream",
            "X-Filename": file.name
        },
        body: file
    });

    const json = await response.json();
    
    setLoading(false);

    console.log(json);
}

function isValidUpload(file){

    const MAX_UPLOAD_SIZE = 250_000_000;

    if( !file || file.type !== 'application/pdf' || file.size > MAX_UPLOAD_SIZE) return false;

    return true;

}


document.getElementById('upload-form').addEventListener('submit', event =>{
    event.preventDefault();
    upload();
});