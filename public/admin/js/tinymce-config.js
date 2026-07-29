tinymce.init({
  selector: 'textarea.textarea-tinymce',
  license_key: 'gpl',
  plugins: "image",
  toolbar: 'image',
  
  // 1. Đường dẫn đến route bạn vừa thêm ở bước trước
  images_upload_url: '/admin/products/upload-tinymce', 

  // 2. Tùy chọn: Cho phép kéo thả ảnh vào editor
  automatic_uploads: true,

  // 3. Nếu bạn muốn giữ lại cái nút "Duyệt file" trong popup ảnh:
  file_picker_types: 'image',
  
  /* Nếu bạn muốn TinyMCE tự xử lý việc upload khi chọn file 
     mà không cần viết logic FileReader phức tạp:
  */
  images_upload_handler: (blobInfo) => new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.withCredentials = false;
    xhr.open('POST', '/admin/products/upload-tinymce');

    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject('HTTP Error: ' + xhr.status);
        return;
      }
      const json = JSON.parse(xhr.responseText);
      if (!json || typeof json.location != 'string') {
        reject('Invalid JSON: ' + xhr.responseText);
        return;
      }
      resolve(json.location); // Link Cloudinary trả về từ Server
    };

    const formData = new FormData();
    formData.append('file', blobInfo.blob(), blobInfo.filename());
    xhr.send(formData);
  })
});