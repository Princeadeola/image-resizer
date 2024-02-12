const form = document.querySelector('#img-form');
const img = document.querySelector('#img');
const outputPath = document.querySelector('#output-path');
const filename = document.querySelector('#filename');
const heightInput = document.querySelector('#height');
const widthInput = document.querySelector('#width');

function loadImage(e){
  const file = e.target.files[0];

  if (!isFileImage(file)){
    alertError('Please select an image file ');
    return;
  }

  // getting the original image dimensions
  const image = new Image();
  image.src = URL.createObjectURL(file);
  image.onload = function(){
    widthInput.value = this.width;
    heightInput.value = this.height;
  }

  // console.log('successfully loaded');
  form.style.display = 'block';
  filename.innerHTML = file.name;
  outputPath.innerHTML = path.join(os.homedir(), 'image-resizer');
}

// sending the  image data to the main
function sendImage(e){
  e.preventDefault();

  const width = widthInput.value;
  const height = heightInput.value;
  const imgPath = img.files[0].path;

  if(!img.files[0]){
    alertError('Please upload an image file ');
    return;
  }

  if(width === '' || height === ''){
    alertError('Please fill in a width and height');
    return;
  }

  //send to main using ipcRenderer
  ipcRenderer.send('image:resize', {
    imgPath, 
    width, 
    height,
  })
}

// catch the image:done event
ipcRenderer.on('image:done', () => {
  alertSuccess(`Image resized to ${widthInput.value} x ${heightInput.value}`);
})

// function to check if selected file is an image
function isFileImage(file){
  const acceptedImageTypes = ['image/gif', 'image/jpeg', 'image/png'];
  return file && acceptedImageTypes.includes(file['type']);
}

function alertError(message){
  Toastify.toast({
    text: message,
    duration: 5000,
    close: false,
    style: {
      background: 'red',
      color: 'white',
      textAlign: 'center',
    }
  });
}

function alertSuccess(message){
  Toastify.toast({
    text: message,
    duration: 5000,
    close: false,
    style: {
      background: 'green',
      color: 'white',
      textAlign: 'center',
    }
  });
}

img.addEventListener('change', loadImage);
form.addEventListener('submit', sendImage);
