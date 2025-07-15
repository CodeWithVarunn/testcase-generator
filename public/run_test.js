document.getElementById("runBtn").addEventListener("click", async () => {
  const rawText = document.getElementById("testCaseText").value.trim();
  const output = document.getElementById("output");
  output.textContent = "Running test...";

  if (!rawText) {
    output.textContent = "⚠️ Please paste a test case before running.";
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/run-test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ testCaseText: rawText }),
    });

    const data = await res.json();

    if (res.ok) {
      output.textContent =
        (data.passed ? "✅ PASSED\n" : "❌ FAILED\n") +
        data.logs.join("\n");
    } else {
      output.textContent = "❌ ERROR: " + (data.error || "Unknown error");
    }
  } catch (err) {
    output.textContent = "❌ Failed to connect: " + err.message;
  }
});

// Dark mode toggle
document.querySelector(".switch input").addEventListener("change", () => {
  document.body.classList.toggle("dark");
});


