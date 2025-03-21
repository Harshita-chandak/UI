console.log("Script loaded");

async function fetchPostTypes() {
    try {
        console.log("Fetching post types...");
        const response = await fetch("/post-types");
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        console.log("Post types received:", data);
        const select = document.getElementById("postTypeSelect");
        select.innerHTML = '<option value="">-- Select --</option>'; // Clear and reset
        data.post_types.forEach(type => {
            const option = document.createElement("option");
            option.value = type;
            option.text = type;
            select.appendChild(option);
        });
    } catch (error) {
        console.error("Error fetching post types:", error);
        alert("Failed to load post types. Please try again later.");
    }
}

async function loadNewsByCategory() {
    const category = document.getElementById("categorySelect").value;
    const newsSelect = document.getElementById("newsSelect");
    if (!category) {
        newsSelect.innerHTML = '<option value="">-- Select News --</option>';
        return;
    }
    try {
        const response = await fetch(`/trends?category=${category}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        console.log("News received:", data);
        newsSelect.innerHTML = '<option value="">-- Select News --</option>';
        data.articles.forEach(article => {
            const option = document.createElement("option");
            option.value = article.title;
            option.text = article.title;
            newsSelect.appendChild(option);
        });
        updateTrend();
    } catch (error) {
        console.error("Error loading news by category:", error);
        newsSelect.innerHTML = '<option value="">Error loading news</option>';
        alert("Failed to load news. Please check the category and try again.");
    }
}

async function loadNewsByTopic() {
    const topic = document.getElementById("topicSearch").value.trim();
    const newsSelect = document.getElementById("newsSelect");
    if (!topic) {
        alert("Please enter a topic to search.");
        newsSelect.innerHTML = '<option value="">-- Select News --</option>';
        return;
    }
    try {
        const response = await fetch(`/fetch_trends/${encodeURIComponent(topic)}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        console.log("News received for topic:", data);
        newsSelect.innerHTML = '<option value="">-- Select News --</option>';
        data.articles.forEach(article => {
            const option = document.createElement("option");
            option.value = article.title;
            option.text = article.title;
            newsSelect.appendChild(option);
        });
        updateTrend();
    } catch (error) {
        console.error("Error loading news by topic:", error);
        newsSelect.innerHTML = '<option value="">Error loading news</option>';
        alert("Failed to load news for the topic. Please try a different topic.");
    }
}


document.getElementById("postTypeSelect").addEventListener("change", function() {
    let postTypeFields = document.getElementById("postTypeFields");
    let postType = document.getElementById("postTypeSelect")?.value; // Get selected value safely

    if (!postTypeFields) return; // Prevent errors if the element is missing

    if (postType === "social_media_post" || postType === "meme_post") {
        postTypeFields.style.display = "block"; // Show Category & Trends
    } else {
        postTypeFields.style.display = "none"; // Hide if no valid post type
    }
});

async function loadForm() {
    const postType = document.getElementById("postTypeSelect").value;
    const formFieldsDiv = document.getElementById("formFields");
    const generateBtn = document.getElementById("generateBtn");
    const updateTrendsBtn = document.getElementById("updateTrendsBtn");
    const postTypeOptionsDiv = document.getElementById("postTypeOptions");

    const validPostTypes = ["meme_post", "social_media_post"]; // Store valid types in an array
    // Guard against empty or invalid postType
    if (!validPostTypes.includes(postType)) {
        formFieldsDiv.innerHTML = "";
        updateTrendsBtn.style.display = "none";

        if(postTypeOptionsDiv){
            postTypeOptionsDiv.style.display = "none"; // Hide options when invalid          
        }
        return;
    }else if(postTypeOptionsDiv){
        postTypeOptionsDiv.style.display = "block"; // Show the div
    } 
  
    // Prevent duplicate execution
    if (formFieldsDiv.dataset.lastPostType === postType) return;
    formFieldsDiv.dataset.lastPostType = postType;
    formFieldsDiv.innerHTML = "";
    generateBtn.disabled = true;
    updateTrendsBtn.style.display = "inline-block";
    
    try {
        const response = await fetch(`/generate_prompt_form?post_type=${postType}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        console.log("Form data received:", data);

        const fields = [...data.required_fields, ...data.optional_fields];
        fields.forEach(field => {
            const div = document.createElement("div");
            div.className = "input-group";
            const label = document.createElement("label");
            label.textContent = `${field} ${data.required_fields.includes(field) ? '*' : ''}:`;
            label.htmlFor = field;
            div.appendChild(label);

            if (field === "trend") {
                const input = document.createElement("input");
                input.type = "hidden";
                input.id = field;
                input.name = field;
                input.value = document.getElementById("newsSelect").value || "";
                div.appendChild(input);
                const span = document.createElement("span");
                span.id = "trendDisplay";
                span.textContent = document.getElementById("newsSelect").value || "Select a news item above";
                div.appendChild(span);
            } else {
                const input = document.createElement("input");
                input.type = "text";
                input.id = field;
                input.name = field;
                input.placeholder = data.example[field] || `Enter ${field}`;
                div.appendChild(input);
            }
            formFieldsDiv.appendChild(div);
        });

        const newsSelectValue = document.getElementById("newsSelect").value;
        generateBtn.disabled = !newsSelectValue && data.required_fields.includes("trend");
    } catch (error) {
        console.error("Error loading form:", error);
        alert("Failed to load form fields. Please select a valid post type.");
        formFieldsDiv.innerHTML = "<p>Error loading form fields.</p>";
    }
}

// Ensure loadForm is only called via event listener
document.getElementById("postTypeSelect").addEventListener("change", loadForm);

async function updateTrends() {
    const category = document.getElementById("categorySelect").value;
    if (!category) {
        alert("Please select a category first.");
        return;
    }
    try {
        const response = await fetch(`/update_trends?category=${category}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        console.log("Trends updated");
        loadNewsByCategory();
        const generateBtn = document.getElementById("generateBtn");
        const newsSelectValue = document.getElementById("newsSelect").value;
        generateBtn.disabled = !newsSelectValue;
    } catch (error) {
        console.error("Error updating trends:", error);
        alert("Failed to update trends. Please try again.");
    }
}

function updateTrend() {
    const newsSelect = document.getElementById("newsSelect");
    const trendInput = document.getElementById("trend");
    const trendDisplay = document.getElementById("trendDisplay");
    if (trendInput && trendDisplay) {
        trendInput.value = newsSelect.value;
        trendDisplay.textContent = newsSelect.value || "Select a news item above";
        console.log("Trend updated to:", trendInput.value);
        const generateBtn = document.getElementById("generateBtn");
        generateBtn.disabled = !newsSelect.value;
    }
}


let generateResult = null; //to store the generated prompt
async function generatePrompt() {
    const postType = document.getElementById("postTypeSelect").value;
    const payload = { post_type: postType };
    
    updateTrend();
    
    const fields = document.querySelectorAll("#formFields input");
    fields.forEach(field => {
        if (field.value) {
            payload[field.id] = field.value;
        }
    });
    console.log("Payload sent:", payload);

    const resultDiv = document.getElementById("result");
    resultDiv.textContent = "Generating prompt...";
    resultDiv.classList.add("loading");

    
    try {
        // Step 1: Generate the prompt
        const generateResponse = await fetch("/generate_prompt", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(payload)
        });
        if (!generateResponse.ok) {
            const errorText = await generateResponse.text();
            throw new Error(`HTTP error! status: ${generateResponse.status}, details: ${errorText}`);
        }
        generateResult = await generateResponse.json();
        console.log("Generated Prompt Response:", generateResult);
        resultDiv.textContent = generateResult.generated_prompt || "No prompt generated";
        resultDiv.classList.remove("loading");
    }catch (error) {
        console.error("Error:", error);
        resultDiv.innerHTML = `
            <div>${generateResult ? generateResult.generated_prompt : "Error generating prompt"}</div>
            <div class="error-message">Error: ${error.message}</div>
        `;
        resultDiv.classList.remove("loading");
        alert(`Failed to process request. Error: ${error.message}`);
    }
}
async function generateImage() {
    if (!generateResult || !generateResult.workflow_data) {
        alert("No valid workflow data. Please generate a prompt first.");
        return;
    }

    const resultDiv1 = document.getElementById("imgresult");
    resultDiv1.innerHTML = `<div>Generating image...</div>`;

    try {       
        const generateImageResponse = await fetch("/generate_image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ workflow_data: generateResult.workflow_data })
        });

        // Check if response is OK
        if (!generateImageResponse.ok) {
            throw new Error(`Server Error: ${generateImageResponse.status}`);
        }

        const imageData = await generateImageResponse.json();
        console.log("🖼️ Parsed Image Data:", imageData);


        resultDiv1.innerHTML = imageData.image_urls.map(url => `
            <div class="image-container" >
                <button class="open-btn" onclick="openImage('${url}')">
                
                <img src="${url}" alt="Generated Image" class="generated-image"  />
                </button>
            </div>
        `).join("");

    } catch (error) {
        console.error("❌ Error in generateImage:", error);
        alert(`Fail to generate image: ${error.message}`);
    }
}

function openImage(imageUrl) {
    // Open a new tab
    const newTab = window.open();
    if (!newTab) {
        alert("Pop-up blocked! Allow pop-ups for this site.");
        return;
    }

    newTab.document.write(`
        <html>
            <head>
                <title>Image Viewer</title>
                <style>
                    body {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        background-color: #000;
                        color: white;
                        height: 100vh;
                        margin: 0;
                    }
                    .container {
                        text-align: center;
                    }
                    img {
                        max-width: 100%;
                        max-height: 100%;
                        border-radius: 10px;
                    }
                    canvas {
                        border: 2px solid white;
                        cursor: crosshair;
                        display: none;
                        max-width: 100%;
                        height: auto;
                        height:100%;
                    }
                    button {
                        padding: 10px 15px;
                        margin-top: 20px;
                        background: #007bff;
                        color: white;
                        border: none;
                        cursor: pointer;
                        border-radius: 5px;
                        display: inline-block;
                    }
                    button:hover {
                        background: #0056b3;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <img id="imageView" src="${imageUrl}" alt="Generated Image">
                    <canvas id="inpaintCanvas"></canvas>
                    <button id="inpaintBtn" style="display:block;">Inpaint</button>
                    <button id="removeBtn" style="display: block;">Remove</button>
                    <button id="undoBtn" style="display:none;">Undo</button>
                    <button id="submitInpaintBtn" style="display:none;">Inpaint with Image</button>
                    <button id="submitTextInpaintBtn" style="display:none;">Inpaint with text</button>
                    <button id="backBtn" style="display:none;">Back</button>
                    <img id="inpaintResult" style="margin-top: 20px; max-width: 100%; display:none;">
                </div>

                <script>
                    let imgSrc = "${imageUrl}";

                    document.getElementById("inpaintBtn").addEventListener("click", function () {
                        startInpainting(imgSrc);
                    });

                    function startInpainting(imageUrl) {
                        let img = new Image();
                        img.crossOrigin = "anonymous";
                        img.src = imageUrl;

                        img.onload = function () {
                            let imageView = document.getElementById("imageView");
                            let canvas = document.getElementById("inpaintCanvas");
                            let ctx = canvas.getContext("2d");

                            // Hide image and show canvas
                            imageView.style.display = "none";
                            canvas.style.display = "block";
                            document.getElementById("removeBtn").style.display = "none";
                            document.getElementById("inpaintBtn").style.display = "none";
                            document.getElementById("undoBtn").style.display = "inline-block";
                            document.getElementById("submitInpaintBtn").style.display = "inline-block";
                            document.getElementById("submitTextInpaintBtn").style.display = "inline-block";
                            document.getElementById("backBtn").style.display = "inline-block";

                            // Set canvas size
                            canvas.width = img.width / 2;
                            canvas.height = img.height / 2;
                            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                            let painting = false;
                            let strokes = [];

                            function startPosition(e) {
                                painting = true;
                                strokes.push([]);
                                draw(e);
                            }

                            function endPosition() {
                                painting = false;
                                ctx.beginPath();
                            }

                            function draw(e) {
                                if (!painting) return;
                                const rect = canvas.getBoundingClientRect();
                                const x = e.clientX - rect.left;
                                const y = e.clientY - rect.top;

                                ctx.lineWidth = 20;
                                ctx.lineCap = "round";
                                ctx.strokeStyle = "red";
                                ctx.lineTo(x, y);
                                ctx.stroke();
                                ctx.beginPath();
                                ctx.moveTo(x, y);

                                strokes[strokes.length - 1].push({ x, y });
                            }

                            function undo() {
                                if (strokes.length === 0) return;

                                strokes.pop();
                                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                                ctx.lineWidth = 20;
                                ctx.lineCap = "round";
                                ctx.strokeStyle = "red";

                                strokes.forEach(stroke => {
                                    ctx.beginPath();
                                    stroke.forEach((point, index) => {
                                        if (index === 0) {
                                            ctx.moveTo(point.x, point.y);
                                        } else {
                                            ctx.lineTo(point.x, point.y);
                                            ctx.stroke();
                                        }
                                    });
                                });
                            }

                            canvas.addEventListener("mousedown", startPosition);
                            canvas.addEventListener("mouseup", endPosition);
                            canvas.addEventListener("mousemove", draw);
                            document.getElementById("undoBtn").addEventListener("click", undo);
                        };
                    }

                    // Submit inpaint request
                    document.getElementById("submitInpaintBtn").addEventListener("click", function () {
                        submitInpaint(imgSrc);
                    });

                    function submitInpaint(imageUrl) {
                        const canvas = document.getElementById("inpaintCanvas");
                        const maskData = canvas.toDataURL("image/png");

                        const formData = new FormData();
                        formData.append("positive_prompt", "A beautiful landscape");
                        formData.append("negative_prompt", "blurry, distorted");
                        formData.append("image", imageUrl);
                        formData.append("mask", maskData);

                        fetch("/inpaint", {
                            method: "POST",
                            body: formData
                        })
                        .then(response => response.blob())
                        .then(blob => {
                            let imgUrl = URL.createObjectURL(blob);
                            document.getElementById("inpaintResult").src = imgUrl;
                            document.getElementById("inpaintResult").style.display = "block";
                        })
                        .catch(error => console.error("Error:", error));
                    }

                    // Back to original image view
                    document.getElementById("backBtn").addEventListener("click", function () {
                        document.getElementById("imageView").style.display = "block";
                        document.getElementById("inpaintCanvas").style.display = "none";
                        document.getElementById("undoBtn").style.display = "none";
                        document.getElementById("submitInpaintBtn").style.display = "none";
                        document.getElementById("backBtn").style.display = "none";
                        document.getElementById("inpaintBtn").style.display = "inline-block";
                    });
                </script>
            </body>
        </html>
    `);
    newTab.document.close(); // Ensures the new page is fully loaded
}

// Add event listener for form changes to enable/disable generate button
document.getElementById("newsSelect").addEventListener("change", updateTrend);
document.getElementById("postTypeSelect").addEventListener("change", loadForm);

// Initial calls
fetchPostTypes();

// Add basic CSS for loading state
const style = document.createElement("style");
style.textContent = `
    .loading {
        font-style: italic;
        color: #888;
    }
    pre {
        white-space: pre-wrap; /* Allow text wrapping */
    }
`;
document.head.appendChild(style);



