const { Pinecone } = require('@pinecone-database/pinecone');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Assume environment variables are loaded by server.js or the script calling this service

/**
 * Generates an embedding for a given text using the Gemini model.
 * @param {string} text - The text to embed.
 * @returns {Promise<number[]>} The vector embedding.
 */
async function generateEmbedding(text) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
    
    const result = await model.embedContent(text);
    if (!result.embedding || !result.embedding.values) {
      throw new Error("Invalid embedding response from Gemini");
    }
    
    return Array.from(result.embedding.values);
  } catch (error) {
    console.error("Error generating embedding:", error.message);
    throw error;
  }
}

/**
 * Retrieves the most relevant knowledge chunks from Pinecone based on the query.
 * @param {string} query - The user's question or search query.
 * @param {number} topK - Number of top results to return.
 * @returns {Promise<Array<{text: string, source: string, score: number}>>}
 */
async function retrieveKnowledge(query, topK = 3) {
  try {
    if (!process.env.PINECONE_API_KEY || !process.env.GEMINI_API_KEY) {
        throw new Error("Missing API keys in environment");
    }

    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    const indexName = process.env.PINECONE_INDEX || 'fintrack-knowledge';
    const index = pc.index(indexName);

    // 1. Convert the user's query into an embedding
    const queryEmbedding = await generateEmbedding(query);

    // 2. Query the Pinecone index for the most similar chunks
    const queryResponse = await index.query({
      vector: queryEmbedding,
      topK: topK,
      includeMetadata: true
    });

    // 3. Format and return the results
    if (!queryResponse.matches || queryResponse.matches.length === 0) {
      return [];
    }

    return queryResponse.matches.map(match => ({
      text: match.metadata?.text || '',
      source: match.metadata?.title || 'Unknown Source',
      score: match.score || 0
    }));
  } catch (error) {
    console.error("Error retrieving knowledge from Pinecone:", error.message);
    throw error;
  }
}

/**
 * Answers a user's question by combining retrieved context and generating an answer with Gemini.
 * @param {string} question - The user's question.
 * @returns {Promise<{answer: string, sources: Array<{source: string, score: number}>}>}
 */
async function askQuestion(question) {
  try {
    // 1. Retrieve relevant knowledge chunks
    const contextChunks = await retrieveKnowledge(question, 3);

    // Extract unique sources for citation
    const uniqueSources = Array.from(
      new Map(contextChunks.map(chunk => [chunk.source, { source: chunk.source, score: chunk.score }])).values()
    );

    // 2. Build the prompt
    let contextText = "No relevant context found.";
    if (contextChunks.length > 0) {
      contextText = contextChunks.map((c, i) => `[Source ${i + 1}: ${c.source}]\n${c.text}`).join('\n\n');
    }

    const prompt = `You are a helpful, professional AI personal finance coach named "FinTrack AI Coach".
Use the provided educational context to answer the user's question accurately.
If the context doesn't contain the answer, use your general knowledge, but prioritize the provided context.
Keep your answers clear, practical, and formatted nicely with markdown.

--- EDUCATIONAL CONTEXT ---
${contextText}

--- USER QUESTION ---
${question}

Answer:`;

    // 3. Generate Answer
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Use gemini-1.5-flash for fast text generation
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent(prompt);
    const answer = result.response.text();

    return {
      answer,
      sources: uniqueSources
    };
  } catch (error) {
    console.error("Error answering question:", error.message);
    throw error;
  }
}

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

/**
 * Ingests a new document by chunking, embedding, and upserting it to Pinecone.
 * @param {string} filename - The name of the document being uploaded.
 * @param {string} textContent - The raw text content of the document.
 */
async function ingestDocument(filename, textContent) {
  try {
    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    const indexName = process.env.PINECONE_INDEX || 'fintrack-knowledge';
    const index = pc.index(indexName);

    const chunks = chunkText(textContent);
    console.log(`- Created ${chunks.length} chunks for ${filename}`);

    const vectors = [];
    
    // Create embeddings for each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await generateEmbedding(chunk);

      vectors.push({
        id: `${filename}-chunk-${i}-${Date.now()}`,
        values: Array.from(embedding),
        metadata: {
          source: filename,
          title: filename.replace('.txt', '').replace('-', ' ').toUpperCase(),
          chunkIndex: i,
          text: chunk
        }
      });
    }

    console.log(`- Upserting ${vectors.length} vectors to Pinecone...`);
    try {
      await index.upsert(vectors);
    } catch (e) {
      if (e.message.includes('Must pass in at least 1 record')) {
        try {
           await index.upsert({ records: vectors });
        } catch (e2) {
           await index.upsert({ upsertRequest: { vectors } });
        }
      } else {
        throw e;
      }
    }
    console.log(`✅ Successfully ingested ${filename}`);
    
    return { success: true, chunksIngested: chunks.length };
  } catch (error) {
    console.error(`Error ingesting ${filename}:`, error.message);
    throw error;
  }
}

module.exports = {
  generateEmbedding,
  retrieveKnowledge,
  askQuestion,
  ingestDocument
};
