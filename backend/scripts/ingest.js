const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { Pinecone } = require('@pinecone-database/pinecone');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load environment variables from root .env
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX = process.env.PINECONE_INDEX || 'fintrack-knowledge';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!PINECONE_API_KEY || !GEMINI_API_KEY) {
  console.error('Missing PINECONE_API_KEY or GEMINI_API_KEY in .env file.');
  process.exit(1);
}

// Initialize clients
const pc = new Pinecone({ apiKey: PINECONE_API_KEY });
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const knowledgeDir = path.join(__dirname, '..', 'knowledge');

// Simple chunking function (splits by double newline/paragraphs)
function chunkText(text, maxChunkSize = 1000) {
  const paragraphs = text.split(/\n\s*\n/);
  const chunks = [];
  let currentChunk = '';

  for (const p of paragraphs) {
    if ((currentChunk.length + p.length) > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
    currentChunk += p + '\n\n';
  }
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  return chunks;
}

async function getEmbedding(text) {
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
  const result = await model.embedContent(text);
  if (!result.embedding || !result.embedding.values) {
     console.error("Invalid embedding result:", JSON.stringify(result));
     throw new Error("Invalid embedding result");
  }
  return result.embedding.values;
}

async function ingest() {
  try {
    console.log('Connecting to Pinecone index:', PINECONE_INDEX);
    const index = pc.Index(PINECONE_INDEX);

    // Recursively find all .txt and .md files
    function getAllFiles(dirPath, arrayOfFiles = []) {
      const files = fs.readdirSync(dirPath);
      files.forEach((file) => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
          arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
        } else if (file.endsWith('.txt') || file.endsWith('.md')) {
          arrayOfFiles.push(fullPath);
        }
      });
      return arrayOfFiles;
    }

    const files = getAllFiles(knowledgeDir);
    console.log(`Found ${files.length} files in knowledge directory.`);

    for (const filePath of files) {
      // Use relative path from knowledgeDir for a clean title
      const relativePath = path.relative(knowledgeDir, filePath);
      console.log(`Processing ${relativePath}...`);
      const text = fs.readFileSync(filePath, 'utf-8');
      
      const chunks = chunkText(text);
      console.log(`- Created ${chunks.length} chunks.`);

      const vectors = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        // Generate embedding
        const embedding = await getEmbedding(chunk);
        
        // Prepare vector record for Pinecone
        vectors.push({
          id: `${relativePath.replace(/\\/g, '-')}-chunk-${i}`,
          values: Array.from(embedding),
          metadata: {
            source: relativePath,
            title: path.basename(relativePath).replace(/\.(txt|md)$/, '').replace(/-/g, ' ').toUpperCase(),
            chunkIndex: i,
            text: chunk // Store text in metadata so we can retrieve it
          }
        });
      }

      // Upsert to Pinecone in batches
      console.log(`- Upserting ${vectors.length} vectors to Pinecone...`);
      try {
        // Pinecone SDK v3/v4 signature
        await index.upsert(vectors);
      } catch (e) {
        if (e.message.includes('Must pass in at least 1 record')) {
          try {
             // Alternative internal signature
             await index.upsert({ records: vectors });
          } catch (e2) {
             // Pinecone SDK v1 signature
             await index.upsert({ upsertRequest: { vectors } });
          }
        } else {
          throw e;
        }
      }
      console.log(`✅ Successfully ingested ${relativePath}`);
    }

    console.log('Ingestion complete!');
  } catch (error) {
    console.error('Error during ingestion:', error);
  }
}

ingest();
