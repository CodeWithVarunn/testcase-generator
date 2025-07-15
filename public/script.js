document.getElementById("generateBtn").addEventListener("click", async (e) => {
  e.preventDefault();

  const inputText = document.getElementById("requirement").value.trim();
  const testType = document.getElementById("testtype").value;
  const complexity = parseInt(document.getElementById("complexity").value);
  const testCount = parseInt(document.getElementById("testcount").value);
  const outputDiv = document.getElementById("output");
  const finalOutputDiv = document.getElementById("finalOutput");

  if (!inputText) {
    outputDiv.innerText = "❗ Please enter a requirement.";
    return;
  }

  outputDiv.innerText = "⏳ Generating test case...";
  sessionStorage.setItem("lastInput", inputText);

  try {
    const res = await fetch("http://localhost:5000/generate-testcase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inputText, testType, complexity, testCount }),
    });

    const data = await res.json();
    const finalOutput = data?.testCase?.raw || "⚠️ No test case generated.";

    outputDiv.innerText = "✅ Test case generated successfully!";
    lastOutput = finalOutput;
    sessionStorage.setItem("lastOutput", finalOutput);

    const lines = finalOutput
      .split("\n")
      .map((line) => line.replace(/\*\*/g, "").trim())
      .filter(Boolean);

    let testCaseHTML = "";
    let section = "";

    lines.forEach((line) => {
      if (/^Test Case\s*\d*[:]?/i.test(line)) {
        if (testCaseHTML) testCaseHTML += `</div>`;
        testCaseHTML += `<div class="test-case"><h3>${line}</h3>`;
        section = "";
      } else if (/^preconditions?[:]?/i.test(line)) {
        section = "pre";
        testCaseHTML += `<p><strong>Preconditions:</strong></p>`;
      } else if (/^steps?[:]?/i.test(line)) {
        section = "steps";
        testCaseHTML += `<p><strong>Steps:</strong></p>`;
      } else if (
        /^expected result[:]?/i.test(line) ||
        /^expected output[:]?/i.test(line)
      ) {
        section = "result";
        testCaseHTML += `<p><strong>Expected Result:</strong></p>`;
      } else {
        const cleanedLine = line.replace(/^[-•*+]\s*/, "");
        testCaseHTML += `<p>${cleanedLine}</p>`;
      }
    });

    testCaseHTML += `</div>`;
    finalOutputDiv.innerHTML = testCaseHTML;
  } catch (err) {
    console.error("❌ Error:", err);
    outputDiv.innerText = "❌ Failed to generate test case.";
  }
});

window.addEventListener("DOMContentLoaded", () => {
  const savedInput = sessionStorage.getItem("lastInput");
  const savedOutput = sessionStorage.getItem("lastOutput");
  const savedTheme = localStorage.getItem("theme");

  if (savedInput) document.getElementById("requirement").value = savedInput;
  if (savedOutput) {
    const finalOutputDiv = document.getElementById("finalOutput");
    const lines = savedOutput
      .split("\n")
      .map((line) => line.replace(/\*\*/g, "").trim())
      .filter(Boolean);

    let testCaseHTML = "";
    let section = "";

    lines.forEach((line) => {
      if (/^Test Case\s*\d*[:]?/i.test(line)) {
        if (testCaseHTML) testCaseHTML += `</div>`;
        testCaseHTML += `<div class="test-case"><h3>${line}</h3>`;
        section = "";
      } else if (/^preconditions?[:]?/i.test(line)) {
        section = "pre";
        testCaseHTML += `<p><strong>Preconditions:</strong></p>`;
      } else if (/^steps?[:]?/i.test(line)) {
        section = "steps";
        testCaseHTML += `<p><strong>Steps:</strong></p>`;
      } else if (
        /^expected result[:]?/i.test(line) ||
        /^expected output[:]?/i.test(line)
      ) {
        section = "result";
        testCaseHTML += `<p><strong>Expected Result:</strong></p>`;
      } else {
        const cleanedLine = line.replace(/^[-•*+]\s*/, "");
        testCaseHTML += `<p>${cleanedLine}</p>`;
      }
    });

    testCaseHTML += `</div>`;
    finalOutputDiv.innerHTML = testCaseHTML;
    lastOutput = savedOutput;
  }

  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    document.getElementById("themeToggle").checked = true;
  }
});

// ✅ OCR logic for Extract Text From Screenshot button
document.getElementById("extractBtn").addEventListener("click", async () => {
  const fileInput = document.getElementById("imageInput");
  const outputDiv = document.getElementById("output");

  if (!fileInput.files.length) {
    outputDiv.innerText = "❗ Please upload an image first.";
    return;
  }

  const imageFile = fileInput.files[0];
  outputDiv.innerText = "🧠 Extracting text using OCR...";

  try {
    const result = await Tesseract.recognize(imageFile, "eng", {
      logger: (m) => console.log(m),
    });

    const extractedText = result.data.text.trim();

    if (extractedText) {
      document.getElementById("requirement").value = extractedText;
      outputDiv.innerText =
        "✅ Text extracted and filled into the requirement box.";
    } else {
      outputDiv.innerText = "⚠️ No text could be extracted. Try another image.";
    }
  } catch (err) {
    console.error("OCR Error:", err);
    outputDiv.innerText = "❌ Failed to extract text.";
  }
});

// ✅ Copy Test Cases
document.getElementById("copyBtn").addEventListener("click", () => {
  const outputText = lastOutput || "";
  if (!outputText) return alert("❗ No test case to copy.");
  navigator.clipboard
    .writeText(outputText)
    .then(() => {
      alert("✅ Test cases copied to clipboard!");
    })
    .catch((err) => {
      console.error("Clipboard error:", err);
      alert("❌ Failed to copy.");
    });
});

// ✅ Download as .txt
document.getElementById("downloadTxtBtn").addEventListener("click", () => {
  if (!lastOutput) return alert("❗ No test case to download.");
  const blob = new Blob([lastOutput], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "test-cases.txt";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// ✅ Theme toggle logic
document.getElementById("themeToggle").addEventListener("change", (e) => {
  if (e.target.checked) {
    document.body.classList.add("dark");
    localStorage.setItem("theme", "dark");
  } else {
    document.body.classList.remove("dark");
    localStorage.setItem("theme", "light");
  }
});







/* // Extract text from uploaded image and put it in the textarea
document.getElementById("extractBtn").addEventListener("click", async () => {
  const imageInput = document.getElementById("imageInput");
  const requirementInput = document.getElementById("requirement");

  if (!imageInput.files.length) {
    alert("Please upload an image first.");
    return;
  }

  const image = imageInput.files[0];
  const reader = new FileReader();

  reader.onload = async function () {
    try {
      const result = await Tesseract.recognize(reader.result, "eng");
      const extractedText = result.data.text.trim();

      if (extractedText) {
        requirementInput.value = extractedText;
        console.log("✅ Extracted Text:", extractedText); // for debugging
      } else {
        alert("⚠️ No text found in the image.");
      }
    } catch (err) {
      console.error("❌ OCR Error:", err);
      alert("Failed to extract text from image.");
    }
  };

  reader.readAsDataURL(image);
});

// Generate test case on button click
document.getElementById("generateBtn").addEventListener("click", async () => {
  const inputText = document.getElementById("requirement").value.trim();
  const output = document.getElementById("output");
  const finalOutput = document.getElementById("finalOutput");

  if (!inputText) {
    alert("Please enter a feature requirement first.");
    return;
  }

  output.textContent = "⏳ Generating test case...";

  try {
    const response = await fetch("http://localhost:5000/generate-testcase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inputText }),
    });

    const data = await response.json();

    if (data.testCase && data.testCase.raw) {
      output.textContent = data.fromMemory
        ? "✅ Loaded from memory."
        : "✅ Generated new test case.";
      finalOutput.textContent = data.testCase.raw;
    } else {
      output.textContent = "⚠️ Could not generate test case.";
    }
  } catch (err) {
    console.error("❌ Client Error:", err);
    output.textContent = "❌ Error generating test case.";
  }
}); */







// ... rest of the code unchanged ...








/* before adding regression and all at the frotened

let lastOutput = ""; // Store output as backup

// ✅ Extract text from screenshot
document.getElementById("extractBtn").addEventListener("click", async () => {
  const file = document.getElementById("imageInput").files[0];
  const outputDiv = document.getElementById("output");

  if (!file) {
    alert("❗ Please upload a screenshot image first.");
    return;
  }

  outputDiv.innerText = "🔍 Extracting text from image...";

  try {
    const result = await Tesseract.recognize(file, "eng");
    const extractedText = result.data.text.trim();

    if (extractedText) {
      document.getElementById("requirement").value = extractedText;
      outputDiv.innerText =
        "✅ Text extracted. You can now generate the test case.";

      // Save extracted text so it's not lost
      sessionStorage.setItem("lastInput", extractedText);
    } else {
      outputDiv.innerText = "⚠️ No readable text found in the image.";
    }
  } catch (err) {
    console.error("❌ OCR Error:", err);
    outputDiv.innerText = "❌ Failed to extract text.";
  }
});

// ✅ Generate test case
document.getElementById("generateBtn").addEventListener("click", async (e) => {
  e.preventDefault();

  const inputText = document.getElementById("requirement").value.trim();
  const testType = document.getElementById("testtype").value;
  // ✅ NEW LINE
  const outputDiv = document.getElementById("output");

  if (!inputText) {
    outputDiv.innerText = "❗ Please enter a requirement.";
    return;
  }

  // Save input to session
  sessionStorage.setItem("lastInput", inputText);

  outputDiv.innerText = "⏳ Generating test case...";

  try {
    const res = await fetch("http://localhost:5000/generate-testcase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inputText, testType }), // ✅ MODIFIED LINE
    });

    const data = await res.json();
    const finalOutput = data?.testCase?.raw || "⚠️ No test case generated.";

    outputDiv.innerText = finalOutput;
    lastOutput = finalOutput;
    sessionStorage.setItem("lastOutput", finalOutput);
  } catch (err) {
    console.error("❌ Error:", err);
    outputDiv.innerText = "❌ Failed to generate test case.";
  }
});

// ✅ Restore textarea and output on page load
window.addEventListener("DOMContentLoaded", () => {
  const savedInput = sessionStorage.getItem("lastInput");
  const savedOutput = sessionStorage.getItem("lastOutput");

  if (savedInput) {
    document.getElementById("requirement").value = savedInput;
  }
  if (savedOutput) {
    document.getElementById("output").innerText = savedOutput;
    lastOutput = savedOutput;
  }
});

// ✅ Watchdog: Restore if output disappears
setInterval(() => {
  const outputDiv = document.getElementById("output");
  if (!outputDiv.innerText.trim() && lastOutput) {
    outputDiv.innerText = lastOutput;
  }
}, 1000); */
