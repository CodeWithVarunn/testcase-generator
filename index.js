const express = require("express");
const cors = require("cors");
const fs = require("fs");
const axios = require("axios");
const stringSimilarity = require("string-similarity");
const { createClient } = require("@supabase/supabase-js");
const { runTestCase } = require("./testRunner"); // ✅ FIXED import

require("dotenv").config();

const supabaseUrl = "https://xrodnddsxshdfxbepsfz.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
app.use(cors());
app.use(express.json());

const FILE_PATH = "data.json";

function cleanOutput(text) {
  return text
    .replace(/^[*•+]\s?/gm, "")
    .replace(/^\s*-\s?/gm, "- ")
    .replace(/\*\*/g, "")
    .replace(/\r?\n{2,}/g, "\n\n")
    .trim();
}

function loadTestCases() {
  if (!fs.existsSync(FILE_PATH)) return [];
  const raw = fs.readFileSync(FILE_PATH);
  return JSON.parse(raw);
}

function saveTestCase(input, testCase) {
  const all = loadTestCases();
  all.push({ input, testCase });
  fs.writeFileSync(FILE_PATH, JSON.stringify(all, null, 2));
}

function getTopSimilarExamples(inputText, topN = 3) {
  const all = loadTestCases();
  if (!Array.isArray(all) || all.length === 0) return [];
  const inputs = all.map((item) => item.input);
  const matches = stringSimilarity.findBestMatch(inputText, inputs).ratings;
  const topMatches = matches
    .sort((a, b) => b.rating - a.rating)
    .slice(0, topN)
    .filter((match) => match.rating > 0.6);
  return topMatches.map((match) =>
    all.find((item) => item.input === match.target)
  );
}

function findExactMatch(inputText, testType, complexity, testCount) {
  const all = loadTestCases();
  return all.find(
    (item) =>
      item.input === inputText &&
      item.testType === testType &&
      item.complexity === complexity &&
      item.testCount === testCount
  );
}

function getTestCaseRange(level) {
  if (level === 1) return "1–5";
  if (level === 2) return "5–20";
  return "20+";
}

function getComplexityDescription(level) {
  if (level === 1) return "short and simple (1–5 steps)";
  if (level === 2) return "moderate in length (5–20 steps)";
  return "detailed and complex (20+ steps)";
}

app.get("/ping", (req, res) => {
  res.send("🟢 Server is alive and responding!");
});

app.post("/generate-testcase", async (req, res) => {
  const inputText = req.body.inputText;
  const testType = req.body.testType || "Functional";
  const complexity = parseInt(req.body.complexity) || 2;
  const testCount = parseInt(req.body.testCount) || 2;

  console.log("📨 Received:", { inputText, testType, complexity, testCount });

  const existingMatch = findExactMatch(inputText, testType, complexity, testCount);
  if (existingMatch) {
    return res.json({ testCase: existingMatch.testCase, fromMemory: true });
  }

  const prompt =
    `You are an expert QA engineer. Generate ${getTestCaseRange(testCount)} ${testType} test cases for the following scenario:\n` +
    `${inputText}\n\n` +
    `Each test case should be ${getComplexityDescription(complexity)}.\n\n` +
    `Test Type Definitions:\n` +
    `- Smoke: Most critical and basic flows only\n` +
    `- Regression: Ensure previously working functionality still works\n` +
    `- Functional: Detailed validation of expected behaviors\n` +
    `- Integration: Focus on how modules/services interact\n\n` +
    `Strict Format:\n` +
    `Test Case 1: [Short title]\n` +
    `Preconditions:\n- [point 1]\n- [point 2]\n` +
    `Steps:\n- [step 1]\n- [step 2]\n` +
    `Expected Result:\n- [result 1]\n- [optional result 2]\n\n` +
    `Rules:\n` +
    `- Use "-" only for bullet points\n` +
    `- Do not use *, +, •, or bold text\n` +
    `- Separate each test case with one blank line\n` +
    `- Respond with plain text only\n\n` +
    `Begin Output:\n`;

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-70b-8192",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const testCaseRaw = response.data.choices[0].message.content || "";
    const cleanedRaw = cleanOutput(testCaseRaw);
    const structured = {
      preconditions: [],
      steps: [],
      expectedResult: [],
      raw: cleanedRaw,
    };

    saveTestCase(inputText, {
      ...structured,
      testType,
      complexity,
      testCount,
    });

    res.json({ testCase: structured, fromMemory: false });
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to generate test case" });
  }
});

app.post("/run-test", async (req, res) => {
  const testCaseText = req.body.testCaseText;

  try {
    const result = await runTestCase(testCaseText); // ✅ fixed call
    res.json(result);
  } catch (err) {
    console.error("Runner error:", err);
    res.status(500).json({ error: err.message || "Unexpected error" });
  }
});

app.listen(5000, () => {
  console.log("✅ Server running on http://localhost:5000");
});








/* after day 5 completion

require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const fs = require("fs");
const stringSimilarity = require("string-similarity");

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://xrodnddsxshdfxbepsfz.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhyb2RuZGRzeHNoZGZ4YmVwc2Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MzM2NTQsImV4cCI6MjA2NzEwOTY1NH0.VNKni1riCvgrVlJvtM2rf7VqgSj254FdRcISyt4q9PU";
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
app.use(cors());
app.use(express.json());

const FILE_PATH = "data.json";

// Load from file
function loadTestCases() {
  if (!fs.existsSync(FILE_PATH)) return [];
  const raw = fs.readFileSync(FILE_PATH);
  return JSON.parse(raw);
}

// Save to file
function saveTestCase(input, testCase) {
  const all = loadTestCases();
  all.push({ input, testCase });
  fs.writeFileSync(FILE_PATH, JSON.stringify(all, null, 2));
}

// Find similar input
function findSimilarInput(inputText) {
  const all = loadTestCases();

  if (!Array.isArray(all)) return null;

  const inputs = all.map((item) => item.input).filter(Boolean);

  if (inputs.length === 0) return null;

  const { bestMatch } = stringSimilarity.findBestMatch(inputText, inputs);
  if (bestMatch.rating > 0.7) {
    return all.find((item) => item.input === bestMatch.target);
  }
  return null;
}

// ✅ Test route to confirm server is alive
app.get("/ping", (req, res) => {
  res.send("🟢 Server is alive and responding!");
});

// 🔥 Main route
app.post("/generate-testcase", async (req, res) => {
  const inputText = req.body.inputText;
  const testType = req.body.testType || "Unspecified";
  const complexity = req.body.complexity || "Medium"; // ✅ ADDED

  console.log("📨 Received inputText:", inputText);

  const similarMatch = findSimilarInput(inputText);
  if (similarMatch) {
    console.log("🟢 Found similar input:", similarMatch.input);

    // ✅ Also save to Supabase in case it's not there
    try {
      const { data, error } = await supabase.from("TestCases").insert([
        {
          input: similarMatch.input,
          output: similarMatch.testCase.raw,
          type: testType,
          complexity: complexity, // ✅ ADDED
        },
      ]);

      if (error) {
        console.error(
          "❌ Supabase insert (Memory Match) error:",
          error.message
        );
      } else {
        console.log("✅ (Memory Match) Supabase insert success:", data);
      }
    } catch (err) {
      console.error(
        "❌ Supabase insert EXCEPTION (Memory Match):",
        err.message
      );
    }

    return res.json({ testCase: similarMatch.testCase, fromMemory: true });
  }

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-70b-8192",
        messages: [
          {
            role: "user",
            content: `Generate test cases with preconditions, steps, and expected result in bullet points for: ${inputText}`,
          },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const testCaseRaw = response.data.choices[0].message.content;

    const structured = {
      preconditions: [],
      steps: [],
      expectedResult: [],
      raw: testCaseRaw || "⚠️ No test case content returned by LLM.",
    };

    saveTestCase(inputText, structured);

    // ✅ Supabase insert (GPT generated)
    try {
      const { data, error } = await supabase.from("TestCases").insert([
        {
          input: inputText,
          output: structured.raw,
          type: testType,
          complexity: complexity, // ✅ ADDED
        },
      ]);

      if (error) {
        console.error("❌ Supabase insert error:", error.message);
      } else {
        console.log("✅ Supabase insert success:", data);
      }
    } catch (err) {
      console.error("❌ Supabase insert EXCEPTION:", err.message);
    }

    res.json({ testCase: structured, fromMemory: false });
  } catch (error) {
    console.error("❌ BACKEND ERROR:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to generate test case" });
  }
});

app.listen(5000, () => {
  console.log("✅ Server running on http://localhost:5000");
}); */

/* require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const fs = require("fs");
const stringSimilarity = require("string-similarity");

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://xrodnddsxshdfxbepsfz.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhyb2RuZGRzeHNoZGZ4YmVwc2Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MzM2NTQsImV4cCI6MjA2NzEwOTY1NH0.VNKni1riCvgrVlJvtM2rf7VqgSj254FdRcISyt4q9PU";
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
app.use(cors());
app.use(express.json());

const FILE_PATH = "data.json";

// Load from file
function loadTestCases() {
  if (!fs.existsSync(FILE_PATH)) return [];
  const raw = fs.readFileSync(FILE_PATH);
  return JSON.parse(raw);
}

// Save to file
function saveTestCase(input, testCase) {
  const all = loadTestCases();
  all.push({ input, testCase });
  fs.writeFileSync(FILE_PATH, JSON.stringify(all, null, 2));
}

// Find similar input
function findSimilarInput(inputText) {
  const all = loadTestCases();

  // ✅ Defensive check
  if (!Array.isArray(all)) return null;

  const inputs = all.map((item) => item.input).filter(Boolean);

  if (inputs.length === 0) return null;

  const { bestMatch } = stringSimilarity.findBestMatch(inputText, inputs);
  if (bestMatch.rating > 0.7) {
    return all.find((item) => item.input === bestMatch.target);
  }
  return null;
}

// ✅ Test route to confirm server is alive
app.get("/ping", (req, res) => {
  res.send("🟢 Server is alive and responding!");
});

// 🔥 Main route
app.post("/generate-testcase", async (req, res) => {
  const inputText = req.body.inputText;
  console.log("📨 Received inputText:", inputText);

  const similarMatch = findSimilarInput(inputText);
  if (similarMatch) {
    console.log("🟢 Found similar input:", similarMatch.input);
    return res.json({ testCase: similarMatch.testCase, fromMemory: true });
  }

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-70b-8192",
        messages: [
          {
            role: "user",
            content: `Generate test cases with preconditions, steps, and expected result in bullet points for: ${inputText}`,
          },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const testCaseRaw = response.data.choices[0].message.content;

    const structured = {
      preconditions: [],
      steps: [],
      expectedResult: [],
      raw: testCaseRaw || "⚠️ No test case content returned by LLM.",
    };

    saveTestCase(inputText, structured);

    // ✅ Supabase insert (only added this block)
    try {
      await supabase.from("testcases").insert([
        {
          input: inputText,
          output: structured.raw,
        },
      ]);
      console.log("✅ Saved to Supabase");
    } catch (err) {
      console.error("❌ Supabase insert error:", err.message);
    }

    res.json({ testCase: structured, fromMemory: false });
  } catch (error) {
    console.error("❌ BACKEND ERROR:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to generate test case" });
  }
});

app.listen(5000, () => {
  console.log("✅ Server running on http://localhost:5000");
}); */

/* require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/generate-testcase", async (req, res) => {
  const inputText = req.body.inputText;
  console.log("📨 Received inputText:", inputText);

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-70b-8192",
        messages: [
          {
            role: "user",
            content: `Generate test cases for: ${inputText}`,
          },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const testCase = response.data.choices[0].message.content;
    res.json({ testCase });
  } catch (error) {
    console.error("❌ BACKEND ERROR:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to generate test case" });
  }
});

app.listen(5000, () => {
  console.log("✅ Server running on http://localhost:5000");
}); */
