const imageInput = document.getElementById('imageInput');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const sendToComfyBtn = document.getElementById('sendToComfy');

imageInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                canvas.classList.remove('d-none');
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

const responseContainer = document.getElementById("responseContainer");
const responseText = document.getElementById("responseText");

// Send to ComfyUI API
sendToComfyBtn.addEventListener("click", async () => {
    if (!canvas || !imageInput.files[0]) {
        alert("Please upload an image before sending.");
        return;
    }

    const obj_name = document.getElementById("obj_name").value.trim();

    if (!obj_name) {
        alert("Please enter a Object Name.");
        return;
    }

    try {
        // Fetch the existing workflow JSON
        const workflowResponse = await fetch("./assets/object_remover_api.json");
        console.log(workflowResponse);
        if (!workflowResponse.ok) throw new Error("Failed to load workflow JSON");
        const jsonBlob = await workflowResponse.blob();

        const imageFile = imageInput.files[0];

        if (!imageFile) {
            alert("Missing image");
            return;
        }

        const formData = new FormData();
        formData.append("obj_name", obj_name);
        formData.append("prompt_file", jsonBlob, "object_remover_api.json");
        formData.append("image", imageFile, "uploaded_image.png");

        const objectRemoverResponse = await fetch("http://127.0.0.1:8000/object_remover", {
            method: "POST",
            body: formData,
        });

        if (!objectRemoverResponse.ok) throw new Error("Failed to get the generated image");
        const imageBlob = await objectRemoverResponse.blob();

        // Display the generated image
        const imageUrl = URL.createObjectURL(imageBlob);
        let imgElement = document.getElementById("generatedImage");

        // If image already exists, update it; otherwise, create a new one
        if (!imgElement) {
            imgElement = document.createElement("img");
            imgElement.id = "generatedImage"; // Assign an ID to track it
            imgElement.classList.add("img-fluid", "mt-3", "border", "rounded");
            document.getElementById("responseContainer").appendChild(imgElement);
        }

        imgElement.src = imageUrl;
        imgElement.alt = "Generated Image";
        responseContainer.classList.remove("d-none");
    } catch (error) {
        console.error("Error:", error);
        responseText.textContent = `Error: ${error.message}`;
        responseContainer.classList.remove("d-none");
    }
});