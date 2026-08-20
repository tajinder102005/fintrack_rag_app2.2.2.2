const path = require('path');
const dotenv = require('dotenv');

// Load env vars since this is a standalone script test
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const { askQuestion } = require('../services/ragService');

async function testGeneration() {
  const query = "What is the 50/30/20 rule and how does it help with budgeting?";
  console.log(`\n💬 Asking: "${query}"\n`);
  
  try {
    const result = await askQuestion(query);
    
    console.log("================= AI ANSWER =================");
    console.log(result.answer);
    console.log("=============================================\n");
    
    console.log("📚 Sources used:");
    result.sources.forEach(s => {
      console.log(`- ${s.source} (Match: ${(s.score * 100).toFixed(2)}%)`);
    });
  } catch (err) {
    console.error("Test failed:", err);
  }
}

testGeneration();
