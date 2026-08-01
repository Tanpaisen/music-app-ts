// upload-image
const uploadImage = document.querySelector("[upload-image]");
if (uploadImage) {
  const uploadImageInput = uploadImage.querySelector("[upload-image-input]");
  const uploadImagePreview = uploadImage.querySelector("[upload-image-preview]");

  uploadImageInput.addEventListener("change", () => {
    const file = uploadImageInput.files[0];
    if (file) {
      uploadImagePreview.src = URL.createObjectURL(file);
    }
  });
}
// End upload-image

// upload-image
const uploadAudio = document.querySelector("[upload-audio]");
if (uploadAudio) {
  const uploadAudioInput = uploadAudio.querySelector("[upload-audio-input]");
  const uploadAudioPlay = uploadAudio.querySelector("[upload-audio-play]");
  const uploadAudioSource = uploadAudio.querySelector("source");

  uploadAudioInput.addEventListener("change", () => {
    const file = uploadAudioInput.files[0];
    if (file) {
      uploadAudioSource.src = URL.createObjectURL(file);
      uploadAudioPlay.load()
    }
  });
}
// End upload-image

// button change status
const buttonChangeStatus = document.querySelectorAll('[button-change-status]')
if (buttonChangeStatus.length > 0) {
  const formChange = document.querySelector('#form-change');
  const path = formChange.getAttribute('data-path')
  buttonChangeStatus.forEach(button => {
    button.addEventListener('click', () => {
      const status = button.getAttribute('data-status')
      const id = button.getAttribute('data-id')
    
      const changeStatus = ( status == "active" ? "inactive" : "active")
      
      const action = `/${path}/${changeStatus}/${id}?_method=PATCH`;
      formChange.action = action;
      formChange.submit();
    })

  })
}
// End button change status

// button delete
const buttonDelete = document.querySelectorAll('[button-delete]')
if (buttonDelete.length > 0) {
  const formDelete = document.querySelector('#form-delete');
  const path = formDelete.getAttribute('data-path')
  buttonDelete.forEach(button => {
    button.addEventListener('click', () => {
      const id = button.getAttribute('data-id')
  
      const action = `/${path}/${id}?_method=DELETE`;
      formDelete.action = action;
      formDelete.submit();
    })

  })
}
// End button delete